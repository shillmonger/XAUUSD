import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TelegramConnection from '@/models/TelegramConnection';
import { verifyToken } from '@/lib/auth';
import { TelegramClient } from 'teleproto';
import { StringSession } from 'teleproto/sessions';
import { decryptTelegramSession, encryptTelegramSession } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the token and get user ID
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get the verification code and optional password from request body
    const body = await request.json();
    const { code, password } = body;

    if (!code && !password) {
      return NextResponse.json(
        { error: 'Verification code or password required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find the pending connection
    const pendingConnection = await TelegramConnection.findOne({
      status: 'connecting',
      telegramUserId: 'pending'
    });

    if (!pendingConnection) {
      return NextResponse.json(
        { error: 'No pending authentication found. Please start the connection process first.' },
        { status: 400 }
      );
    }

    // Decrypt the session data
    const sessionData = JSON.parse(decryptTelegramSession(pendingConnection.sessionEncrypted));
    const { sessionString, apiId, apiHash, phoneNumber } = sessionData;

    // Create a new Telegram client with the partial session
    const stringSession = new StringSession(sessionString);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    try {
      // Connect to Telegram and complete authentication using the built-in start method
      await client.start({
        phoneNumber: async () => phoneNumber,
        password: async () => {
          if (password) {
            return password;
          }
          throw new Error('Two-factor authentication password required');
        },
        phoneCode: async () => {
          if (code) {
            return code;
          }
          throw new Error('OTP code required');
        },
        onError: (err) => {
          console.error('Telegram client error:', err);
          throw err;
        },
      });

      // Get user info
      const me = await client.getMe();

      // Save the complete session string
      const completeSessionString = client.session.save();

      // Encrypt the complete session
      const encryptedSession = encryptTelegramSession(completeSessionString);

      // Update the connection record
      await TelegramConnection.findOneAndUpdate(
        { _id: pendingConnection._id },
        {
          telegramUserId: me.id.toString(),
          username: me.username,
          firstName: me.firstName,
          sessionEncrypted: encryptedSession,
          status: 'connected',
          connectedAt: new Date(),
          lastCheckedAt: new Date(),
          errorMessage: null,
        },
        { returnDocument: 'after' }
      );

      // Disconnect the client
      await client.disconnect();

      return NextResponse.json({
        success: true,
        message: 'Telegram authentication completed successfully',
        account: {
          telegramUserId: me.id.toString(),
          username: me.username,
          firstName: me.firstName,
        },
      });

    } catch (error: any) {
      await client.disconnect();

      // Update connection with error
      await TelegramConnection.findOneAndUpdate(
        { _id: pendingConnection._id },
        {
          status: 'error',
          errorMessage: error.message || 'Authentication failed',
        }
      );

      if (error.message && error.message.includes('SESSION_PASSWORD_NEEDED')) {
        return NextResponse.json({
          success: false,
          requiresPassword: true,
          message: 'Two-factor authentication password required.',
        });
      }

      if (error.message && (error.message.includes('PHONE_CODE_INVALID') || 
                             error.message.toLowerCase().includes('invalid') ||
                             error.message.includes('phone code'))) {
        return NextResponse.json({
          success: false,
          error: 'Invalid verification code. Please try again.',
        });
      }

      throw error;
    }

  } catch (error) {
    console.error('Telegram verify error:', error);
    return NextResponse.json(
      { error: 'Failed to verify Telegram authentication: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

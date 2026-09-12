import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TelegramConnection from '@/models/TelegramConnection';
import { verifyToken } from '@/lib/auth';
import { TelegramClient } from 'teleproto';
import { StringSession } from 'teleproto/sessions';

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

    // Get Telegram credentials from environment
    const apiId = parseInt(process.env.TELEGRAM_API_ID || '');
    const apiHash = process.env.TELEGRAM_API_HASH;
    const phoneNumber = process.env.TELEGRAM_PHONE_NUMBER;

    if (!apiId || !apiHash || !phoneNumber) {
      return NextResponse.json(
        { error: 'Telegram credentials not configured' },
        { status: 500 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if there's already a connected session we can reuse
    const existingConnection = await TelegramConnection.findOne({ status: 'connected' }).sort({ createdAt: -1 });
    
    if (existingConnection) {
      // Try to reuse the existing session
      try {
        const { decryptTelegramSession } = await import('@/lib/encryption');
        const sessionString = decryptTelegramSession(existingConnection.sessionEncrypted);
        
        // Create a client with the existing session
        const stringSession = new StringSession(sessionString);
        const client = new TelegramClient(stringSession, apiId, apiHash, {
          connectionRetries: 5,
        });

        // Try to connect with the existing session
        await client.connect();
        
        // Verify the session is still valid by getting user info
        await client.getMe();
        
        // Session is valid, update the connection
        await TelegramConnection.findByIdAndUpdate(
          existingConnection._id,
          {
            lastCheckedAt: new Date(),
            status: 'connected',
          }
        );
        
        await client.disconnect();

        return NextResponse.json({
          success: true,
          message: 'Telegram reconnected successfully using existing session',
          account: {
            telegramUserId: existingConnection.telegramUserId,
            username: existingConnection.username,
            firstName: existingConnection.firstName,
          },
        });
      } catch (error) {
        // Existing session is invalid, continue with fresh authentication
        console.log('Existing session invalid, starting fresh authentication');
      }
    }

    // Check if there's already a connection in progress and delete it
    const connectingConnection = await TelegramConnection.findOne({ status: 'connecting' });
    if (connectingConnection) {
      await TelegramConnection.deleteOne({ _id: connectingConnection._id });
    }

    // Create a new Telegram client for fresh authentication
    const stringSession = new StringSession('');
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    try {
      // Connect to Telegram
      await client.connect();

      // Send the phone number to initiate authentication and get OTP
      const { Api } = await import('teleproto/tl');
      const result = await client.invoke(new Api.auth.SendCode({
        phoneNumber,
        apiId,
        apiHash,
        settings: new Api.CodeSettings({
          allowFlashcall: true,
          currentNumber: true,
          allowAppHash: true,
        }),
      }));

      // Save the partial session for verification
      const partialSession = client.session.save();
      const { encryptTelegramSession } = await import('@/lib/encryption');
      const encryptedSession = encryptTelegramSession(JSON.stringify({
        sessionString: partialSession,
        apiId,
        apiHash,
        phoneNumber,
      }));

      // Store the partial session in database
      await TelegramConnection.findOneAndUpdate(
        { telegramUserId: 'pending' },
        {
          provider: 'telegram',
          telegramUserId: 'pending',
          sessionEncrypted: encryptedSession,
          status: 'connecting',
          errorMessage: 'OTP verification required',
        },
        { upsert: true, returnDocument: 'after' }
      );

      // Disconnect the client
      await client.disconnect();

      return NextResponse.json({
        success: false,
        requiresOtp: true,
        message: 'OTP code sent to your Telegram app. Please enter it to complete authentication.',
      });

    } catch (error: any) {
      await client.disconnect();

      // Check if 2FA is required
      if (error.message && error.message.includes('SESSION_PASSWORD_NEEDED')) {
        return NextResponse.json({
          success: false,
          requiresPassword: true,
          message: 'Two-factor authentication password required.',
        });
      }

      throw error;
    }

  } catch (error) {
    console.error('Telegram connect error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Telegram: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TelegramConnection from '@/models/TelegramConnection';
import { verifyToken } from '@/lib/auth';
import { TelegramClient } from 'teleproto';
import { StringSession } from 'teleproto/sessions';
import { decryptTelegramSession } from '@/lib/encryption';

// POST fetch Telegram groups (backward compatibility)
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

    if (!apiId || !apiHash) {
      return NextResponse.json(
        { error: 'Telegram credentials not configured' },
        { status: 500 }
      );
    }

    // Connect to database
    await connectDB();

    // Find the active Telegram connection
    const connection = await TelegramConnection.findOne({ 
      status: 'connected' 
    }).sort({ createdAt: -1 });

    if (!connection) {
      return NextResponse.json(
        { error: 'Telegram not connected. Please connect your Telegram account first.' },
        { status: 400 }
      );
    }

    // Decrypt the session
    const sessionString = decryptTelegramSession(connection.sessionEncrypted);

    // Create a new Telegram client with the saved session
    const stringSession = new StringSession(sessionString);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    try {
      // Connect to Telegram
      await client.connect();

      // Get all dialogs (chats, channels, groups)
      const dialogs = await client.getDialogs({});

      // Filter for groups and channels only, and format the response
      const groups = dialogs
        .filter(dialog => {
          // Include groups and channels, exclude users and bots
          return dialog.entity && 
                 (dialog.entity.className === 'Channel' || 
                  dialog.entity.className === 'Chat');
        })
        .map(dialog => {
          const entity = dialog.entity;
          if (!entity) return null;

          // Type guard for Channel/Chat entities
          const isChannel = entity.className === 'Channel';
          const isChat = entity.className === 'Chat';

          // Safely access properties with optional chaining and type checks
          const title = isChannel || isChat ? (entity as any).title : undefined;
          const username = isChannel || isChat ? (entity as any).username : undefined;

          return {
            id: entity.id.toString(),
            name: title || username || 'Unknown',
            profile_image: '', // Telegram doesn't provide profile images easily via API
            type: isChannel ? 'channel' : 'group',
            username: username || '',
          };
        })
        .filter((group): group is NonNullable<typeof group> => group !== null);

      // Update last checked time
      await TelegramConnection.findByIdAndUpdate(
        connection._id,
        { lastCheckedAt: new Date() }
      );

      // Disconnect the client
      await client.disconnect();

      return NextResponse.json({
        success: true,
        groups,
        count: groups.length,
      });

    } catch (error) {
      await client.disconnect();
      throw error;
    }

  } catch (error) {
    console.error('Telegram groups fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Telegram groups: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

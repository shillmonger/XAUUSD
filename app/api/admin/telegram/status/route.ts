import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TelegramConnection from '@/models/TelegramConnection';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // Connect to database
    await connectDB();

    // Find the most recent Telegram connection
    const connection = await TelegramConnection.findOne().sort({ createdAt: -1 });

    if (!connection) {
      return NextResponse.json({
        connected: false,
        status: 'disconnected',
      });
    }

    // Return safe connection information only (no sensitive data)
    return NextResponse.json({
      connected: connection.status === 'connected',
      status: connection.status,
      account: {
        telegramUserId: connection.telegramUserId,
        username: connection.username,
        firstName: connection.firstName,
      },
      connectedAt: connection.connectedAt,
      lastCheckedAt: connection.lastCheckedAt,
      errorMessage: connection.errorMessage,
    });

  } catch (error) {
    console.error('Telegram status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check Telegram connection status' },
      { status: 500 }
    );
  }
}

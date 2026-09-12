import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TelegramConnection from '@/models/TelegramConnection';
import { verifyToken } from '@/lib/auth';

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

    // Connect to database
    await connectDB();

    // Find and update the most recent connection
    const connection = await TelegramConnection.findOneAndUpdate(
      { status: 'connected' },
      {
        status: 'disconnected',
        sessionEncrypted: '', // Clear the encrypted session
        errorMessage: 'Disconnected by user',
      },
      { sort: { createdAt: -1 } }
    );

    if (!connection) {
      return NextResponse.json(
        { error: 'No active Telegram connection found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Telegram disconnected successfully',
    });

  } catch (error) {
    console.error('Telegram disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Telegram: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

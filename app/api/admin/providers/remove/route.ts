import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TelegramProvider from '@/models/TelegramProvider';
import { verifyToken } from '@/lib/auth';

// POST remove a provider (backward compatibility)
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

    // Get groupId from request body
    const body = await request.json();
    const { groupId } = body;

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find and delete the provider
    const provider = await TelegramProvider.findOneAndDelete({ groupId });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Provider removed successfully',
    });

  } catch (error) {
    console.error('Provider remove error:', error);
    return NextResponse.json(
      { error: 'Failed to remove provider: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

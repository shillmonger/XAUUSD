import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TelegramProvider from '@/models/TelegramProvider';
import { verifyToken } from '@/lib/auth';

// GET all saved providers
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

    // Get all providers
    const providers = await TelegramProvider.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      providers,
      count: providers.length,
    });

  } catch (error) {
    console.error('Telegram providers fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Telegram providers: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// POST save a new provider
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

    // Get provider data from request body
    const body = await request.json();
    const { groupId, groupName, profileImage, type, username } = body;

    if (!groupId || !groupName) {
      return NextResponse.json(
        { error: 'Group ID and Group Name are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if provider already exists
    const existingProvider = await TelegramProvider.findOne({ groupId });
    if (existingProvider) {
      return NextResponse.json(
        { error: 'Provider already saved' },
        { status: 409 }
      );
    }

    // Create new provider
    const provider = await TelegramProvider.create({
      groupId,
      groupName,
      profileImage: profileImage || '',
      type: type || 'group',
      username: username || '',
      isActive: true,
      lastProcessedMessageId: 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Provider saved successfully',
      provider,
    });

  } catch (error) {
    console.error('Telegram provider save error:', error);
    return NextResponse.json(
      { error: 'Failed to save Telegram provider: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

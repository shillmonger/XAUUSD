import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TelegramProvider from '@/models/TelegramProvider';
import { verifyToken } from '@/lib/auth';

// GET all saved providers (backward compatibility)
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
    console.error('Providers fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

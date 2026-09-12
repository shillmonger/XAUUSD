import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TelegramProvider from '@/models/TelegramProvider';
import { verifyToken } from '@/lib/auth';

// PATCH enable/disable a provider
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get the action from request body
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive field is required and must be a boolean' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find and update the provider
    const provider = await TelegramProvider.findByIdAndUpdate(
      params.id,
      { isActive },
      { new: true }
    );

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Provider ${isActive ? 'enabled' : 'disabled'} successfully`,
      provider,
    });

  } catch (error) {
    console.error('Telegram provider update error:', error);
    return NextResponse.json(
      { error: 'Failed to update Telegram provider: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// DELETE a provider
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Find and delete the provider
    const provider = await TelegramProvider.findByIdAndDelete(params.id);

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Provider deleted successfully',
    });

  } catch (error) {
    console.error('Telegram provider delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete Telegram provider: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

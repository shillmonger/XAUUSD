import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import DerivAccount from '@/models/DerivAccount';
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
    const userId = decoded.userId;

    // Parse request body
    const body = await request.json();
    const { botStatus } = body;

    // Validate botStatus
    if (!botStatus || !['ACTIVE', 'PAUSED', 'OFF'].includes(botStatus)) {
      return NextResponse.json(
        { error: 'Invalid bot status. Must be ACTIVE, PAUSED, or OFF' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find the user's Deriv account connection
    const derivAccount = await DerivAccount.findOne({ 
      userId,
      connectionStatus: 'connected'
    });

    if (!derivAccount) {
      return NextResponse.json(
        { error: 'No connected Deriv account found' },
        { status: 404 }
      );
    }

    // Update bot status
    derivAccount.botStatus = botStatus;
    await derivAccount.save();

    return NextResponse.json({
      success: true,
      botStatus: derivAccount.botStatus,
    });

  } catch (error) {
    console.error('Bot status update error:', error);
    return NextResponse.json(
      { error: 'Failed to update bot status' },
      { status: 500 }
    );
  }
}

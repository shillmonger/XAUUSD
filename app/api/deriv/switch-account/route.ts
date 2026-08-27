import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
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
    const { accountType } = body;

    // Validate accountType
    if (!accountType || !['demo', 'real'].includes(accountType)) {
      return NextResponse.json(
        { error: 'Invalid account type. Must be demo or real' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has an account of the requested type connected
    const targetAccount = await DerivAccount.findOne({ 
      userId,
      accountType,
      connectionStatus: 'connected'
    });

    if (!targetAccount) {
      return NextResponse.json(
        { error: `No ${accountType} account connected. Please connect a ${accountType} account first.` },
        { status: 404 }
      );
    }

    // Update user's active account type
    user.activeDerivAccountType = accountType;
    await user.save();

    return NextResponse.json({
      success: true,
      activeAccountType: user.activeDerivAccountType,
      accountId: targetAccount.derivAccountId,
      balance: targetAccount.balance || '0',
      currency: targetAccount.currency || 'USD',
      botStatus: targetAccount.botStatus || 'OFF',
    });

  } catch (error) {
    console.error('Switch account error:', error);
    return NextResponse.json(
      { error: 'Failed to switch account type' },
      { status: 500 }
    );
  }
}

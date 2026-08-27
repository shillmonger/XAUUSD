import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import DerivAccount from '@/models/DerivAccount';
import User from '@/models/User';
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

    // Connect to database
    await connectDB();

    // Get user to determine active account type
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find and update the user's active Deriv account connection
    const derivAccount = await DerivAccount.findOne({ 
      userId,
      accountType: user.activeDerivAccountType || 'demo'
    });
    
    if (!derivAccount) {
      return NextResponse.json(
        { error: 'No Deriv account connection found' },
        { status: 404 }
      );
    }

    // Update connection status to disconnected instead of deleting
    derivAccount.connectionStatus = 'disconnected';
    derivAccount.disconnectedAt = new Date();
    derivAccount.botStatus = 'OFF';
    await derivAccount.save();

    // Check if user has another connected account type to switch to
    const otherAccountType = user.activeDerivAccountType === 'demo' ? 'real' : 'demo';
    const otherAccount = await DerivAccount.findOne({ 
      userId,
      accountType: otherAccountType,
      connectionStatus: 'connected'
    });

    if (otherAccount) {
      // Switch to the other connected account
      user.activeDerivAccountType = otherAccountType;
      await user.save();
    }

    return NextResponse.json({
      message: 'Deriv account disconnected successfully',
    });

  } catch (error) {
    console.error('Deriv disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Deriv account' },
      { status: 500 }
    );
  }
}

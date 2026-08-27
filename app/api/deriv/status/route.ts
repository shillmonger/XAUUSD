import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import DerivAccount from '@/models/DerivAccount';
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
    const userId = decoded.userId;

    // Connect to database
    await connectDB();

    // Find the user's Deriv account connection
    const derivAccount = await DerivAccount.findOne({ 
      userId,
      connectionStatus: 'connected'
    });

    if (!derivAccount) {
      return NextResponse.json({
        connected: false,
      });
    }

    // Check if the token has expired
    if (derivAccount.tokenExpiresAt < new Date()) {
      // Update connection status to disconnected
      derivAccount.connectionStatus = 'disconnected';
      await derivAccount.save();
      
      return NextResponse.json({
        connected: false,
        error: 'token_expired',
      });
    }

    // Return safe connection information only
    return NextResponse.json({
      connected: true,
      accountId: derivAccount.derivAccountId,
      accountType: derivAccount.accountType.toUpperCase(),
      connectionStatus: derivAccount.connectionStatus,
      connectedAt: derivAccount.connectedAt,
      lastVerifiedAt: derivAccount.lastVerifiedAt,
      balance: derivAccount.balance || '0',
      currency: derivAccount.currency || 'USD',
      accountStatus: derivAccount.accountStatus || 'unknown',
      botStatus: derivAccount.botStatus || 'OFF',
    });

  } catch (error) {
    console.error('Deriv status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check connection status' },
      { status: 500 }
    );
  }
}

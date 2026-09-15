import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import DerivAccount from '@/models/DerivAccount';
import User from '@/models/User';
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

    // Get user to determine active account type
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
     );
    }

    console.log('User activeDerivAccountType:', user.activeDerivAccountType);
    console.log('User full object:', JSON.stringify(user, null, 2));

    // If user doesn't have activeDerivAccountType set, default to demo and save it
    if (!user.activeDerivAccountType) {
      user.activeDerivAccountType = 'demo';
      await user.save();
      console.log('Set default activeDerivAccountType to demo');
    }

    // Find the user's Deriv MT5/CFD account connection for the active account type
    const derivAccount = await DerivAccount.findOne({ 
      userId,
      accountType: user.activeDerivAccountType || 'demo',
      accountPlatform: 'mt5',
      connectionStatus: 'connected'
    });

    console.log('Found MT5 derivAccount for type:', user.activeDerivAccountType || 'demo', derivAccount ? 'YES' : 'NO');

    if (!derivAccount) {
      // Check if there's an old Options account and mark it as invalid
      const oldOptionsAccount = await DerivAccount.findOne({ 
        userId,
        accountType: user.activeDerivAccountType || 'demo',
        accountPlatform: { $in: ['options', 'unknown'] },
        connectionStatus: 'connected'
      });

      if (oldOptionsAccount) {
        console.log('[Deriv Status] Found old Options account, marking as invalid');
        oldOptionsAccount.connectionStatus = 'invalid';
        oldOptionsAccount.accountPlatform = 'options';
        oldOptionsAccount.product = 'options';
        await oldOptionsAccount.save();
      }

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

    // Verify this is actually an MT5/CFD account
    if (derivAccount.accountPlatform !== 'mt5' || derivAccount.product !== 'cfd') {
      console.error('[Deriv Status] Account is not MT5/CFD, marking as invalid');
      derivAccount.connectionStatus = 'invalid';
      await derivAccount.save();
      
      return NextResponse.json({
        connected: false,
        error: 'invalid_account_type',
      });
    }

    // Return safe connection information only
    return NextResponse.json({
      connected: true,
      accountId: derivAccount.derivAccountId,
      accountType: derivAccount.accountType.toUpperCase(),
      accountPlatform: derivAccount.accountPlatform,
      product: derivAccount.product,
      connectionStatus: derivAccount.connectionStatus,
      connectedAt: derivAccount.connectedAt,
      lastVerifiedAt: derivAccount.lastVerifiedAt,
      balance: derivAccount.balance || '0',
      currency: derivAccount.currency || 'USD',
      accountStatus: derivAccount.accountStatus || 'unknown',
      botStatus: derivAccount.botStatus || 'OFF',
      activeAccountType: user.activeDerivAccountType || 'demo',
      mt5Server: derivAccount.mt5Server,
    });

  } catch (error) {
    console.error('Deriv status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check connection status' },
      { status: 500 }
    );
  }
}

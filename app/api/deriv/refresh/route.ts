import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import DerivAccount from '@/models/DerivAccount';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/deriv/refresh
 *
 * Refreshes the connected Deriv MT5/CFD account balance and settings.
 *
 * NOTE: This route no longer calls the deprecated Options REST endpoint
 * (https://api.derivws.com/trading/v1/options/accounts).
 * Account state must be reported by the external MT5 EA/bridge. Deriv's
 * documented OAuth API does not expose a direct MT5 account-state endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    const userId = decoded.userId;

    await connectDB();

    // Find the user's connected MT5/CFD account
    const derivAccount = await DerivAccount.findOne({
      userId,
      accountPlatform: 'mt5',
      product: 'cfd',
      connectionStatus: 'connected',
    });

    if (!derivAccount) {
      return NextResponse.json(
        { error: 'No connected Deriv MT5/CFD account found' },
        { status: 404 }
      );
    }

    // Check token expiry
    if (derivAccount.tokenExpiresAt < new Date()) {
      derivAccount.connectionStatus = 'disconnected';
      await derivAccount.save();
      return NextResponse.json(
        { error: 'Access token expired. Please reconnect your Deriv MT5/CFD account.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: false,
      error: 'MT5_BALANCE_REQUIRES_EA_BRIDGE',
      message: 'Deriv OAuth does not expose a documented MT5 balance endpoint. The MT5 EA/bridge must report account state.',
    }, { status: 501 });

  } catch (error) {
    console.error('[Deriv Refresh] Error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh MT5 account data' },
      { status: 500 }
    );
  }
}

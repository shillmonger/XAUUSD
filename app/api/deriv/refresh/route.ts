import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import DerivAccount from '@/models/DerivAccount';
import { verifyToken } from '@/lib/auth';
import { decrypt } from '@/lib/encryption';
import { createDerivMT5Service } from '@/services/deriv-mt5.service';

/**
 * POST /api/deriv/refresh
 *
 * Refreshes the connected Deriv MT5/CFD account balance and settings
 * using the official Deriv WebSocket API (mt5_get_settings).
 *
 * NOTE: This route no longer calls the deprecated Options REST endpoint
 * (https://api.derivws.com/trading/v1/options/accounts).
 * MT5 account data is retrieved via wss://ws.derivws.com/websockets/v3
 * using the mt5_get_settings WebSocket call.
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

    // Decrypt the stored access token
    let accessToken: string;
    try {
      accessToken = decrypt(derivAccount.accessTokenEncrypted);
    } catch {
      return NextResponse.json(
        { error: 'Failed to decrypt access token' },
        { status: 500 }
      );
    }

    // Use the MT5 service to fetch current account settings via WebSocket
    const mt5Service = createDerivMT5Service(accessToken, process.env.DERIV_CLIENT_ID!);

    const mt5Login = derivAccount.mt5Login;
    if (!mt5Login) {
      return NextResponse.json(
        { error: 'MT5 login not found on account record' },
        { status: 500 }
      );
    }

    let updatedSettings;
    try {
      updatedSettings = await mt5Service.getMT5AccountSettings(mt5Login);
    } catch (wsError) {
      const msg = wsError instanceof Error ? wsError.message : 'Unknown error';
      console.error('[Deriv Refresh] MT5 settings fetch failed:', msg);
      return NextResponse.json(
        { error: `Failed to fetch MT5 account data: ${msg}` },
        { status: 502 }
      );
    }

    // Verify the account is still active and is still an MT5/CFD account
    if (updatedSettings.accountStatus !== 'active') {
      console.warn('[Deriv Refresh] MT5 account no longer active:', updatedSettings.accountStatus);
      derivAccount.accountStatus = updatedSettings.accountStatus;
      derivAccount.connectionStatus = 'disconnected';
      await derivAccount.save();
      return NextResponse.json(
        { error: `MT5 account status is '${updatedSettings.accountStatus}'. Please reconnect.` },
        { status: 403 }
      );
    }

    // Update the stored account record with fresh MT5 data
    derivAccount.balance = updatedSettings.balance.toString();
    derivAccount.currency = updatedSettings.currency;
    derivAccount.accountStatus = updatedSettings.accountStatus;
    derivAccount.mt5Server = updatedSettings.server;
    derivAccount.lastVerifiedAt = new Date();
    await derivAccount.save();

    console.log('[Deriv Refresh] MT5 account refreshed:', {
      login: mt5Login.substring(0, 6) + '...',
      balance: updatedSettings.balance,
      currency: updatedSettings.currency,
      server: updatedSettings.server,
    });

    return NextResponse.json({
      success: true,
      accountId: derivAccount.derivAccountId,
      accountType: derivAccount.accountType.toUpperCase(),
      accountPlatform: 'mt5',
      product: 'cfd',
      balance: derivAccount.balance,
      currency: derivAccount.currency,
      accountStatus: derivAccount.accountStatus,
      mt5Server: derivAccount.mt5Server,
      lastVerifiedAt: derivAccount.lastVerifiedAt,
    });

  } catch (error) {
    console.error('[Deriv Refresh] Error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh MT5 account data' },
      { status: 500 }
    );
  }
}

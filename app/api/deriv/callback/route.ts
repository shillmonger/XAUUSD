import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import DerivAccount from '@/models/DerivAccount';
import OAuthState from '@/models/OAuthState';
import { encrypt } from '@/lib/encryption';
import { createDerivMT5Service, resolveDerivAppId } from '@/services/deriv-mt5.service';

export async function GET(request: NextRequest) {
  try {
    // Get the code and state from query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/UserDashboard/connect-deriv?error=missing_params', process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    // Connect to database
    await connectDB();

    // Find the OAuth state record
    const oauthState = await OAuthState.findOne({ state });
    if (!oauthState) {
      return NextResponse.redirect(
        new URL('/UserDashboard/connect-deriv?error=invalid_state', process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    // Check if the OAuth state has expired
    if (oauthState.expiresAt < new Date()) {
      await OAuthState.deleteOne({ state });
      return NextResponse.redirect(
        new URL('/UserDashboard/connect-deriv?error=expired_state', process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    // Exchange authorization code for access token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.DERIV_REDIRECT_URI!,
      client_id: process.env.DERIV_CLIENT_ID!,
      code_verifier: oauthState.codeVerifier,
    });

    // Only include client_secret if it's set and not a placeholder
    if (process.env.DERIV_CLIENT_SECRET && process.env.DERIV_CLIENT_SECRET !== 'deriv_app_secret') {
      tokenParams.append('client_secret', process.env.DERIV_CLIENT_SECRET);
    }

    const tokenResponse = await fetch('https://auth.deriv.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    });

    // Log response details before parsing
    const responseText = await tokenResponse.text();
    console.error('Token exchange response:', {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      contentType: tokenResponse.headers.get('content-type'),
      body: responseText.substring(0, 500),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed: Status', tokenResponse.status, 'Body:', responseText);
      console.error('Request params:', {
        grant_type: 'authorization_code',
        code: code.substring(0, 10) + '...',
        redirect_uri: process.env.DERIV_REDIRECT_URI,
        client_id: process.env.DERIV_CLIENT_ID,
        code_verifier: oauthState.codeVerifier.substring(0, 10) + '...',
      });
      await OAuthState.deleteOne({ state });
      return NextResponse.redirect(
        new URL('/UserDashboard/connect-deriv?error=token_exchange_failed', process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const tokenData = JSON.parse(responseText);
    const accessToken = tokenData.access_token;

    // Verify the connected Deriv MT5/CFD account using the MT5 service
    console.log('[Deriv Callback] Starting MT5 account verification');
    
    const mt5Service = createDerivMT5Service(accessToken, resolveDerivAppId());
    
    // Determine target account type from OAuth state or default to demo
    const targetAccountType = (oauthState.targetAccountType as 'demo' | 'real') || 'demo';
    
    console.log('[Deriv Callback] Looking for MT5 account type:', targetAccountType);
    
    // Find the appropriate MT5 account
    const mt5AccountResult = await mt5Service.findMT5Account(targetAccountType);
    
    if (!mt5AccountResult.found || !mt5AccountResult.account) {
      console.error('[Deriv Callback] MT5 account not found or invalid:', mt5AccountResult.error);
      await OAuthState.deleteOne({ state });
      
      // Determine if this is because no MT5 accounts exist at all
      if (mt5AccountResult.error?.includes('No MT5 accounts found')) {
        return NextResponse.redirect(
          new URL('/UserDashboard/connect-deriv?error=no_mt5_accounts', process.env.NEXT_PUBLIC_APP_URL!)
        );
      }
      
      return NextResponse.redirect(
        new URL('/UserDashboard/connect-deriv?error=account_verification_failed', process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const mt5Account = mt5AccountResult.account;
    
    // Verify this is NOT an Options account
    if (mt5Account.server.includes('options') || mt5Account.server.includes('multipliers')) {
      console.error('[Deriv Callback] Detected Options/Multipliers account, rejecting');
      await OAuthState.deleteOne({ state });
      return NextResponse.redirect(
        new URL('/UserDashboard/connect-deriv?error=options_account_not_supported', process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const derivAccountId = mt5Account.login; // MT5 uses login as account ID
    const accountType = mt5Account.accountType;
    const balance = mt5Account.balance.toString();
    const currency = mt5Account.currency;
    const accountStatus = mt5Account.accountStatus;
    const mt5Server = mt5Account.server;
    
    console.log('[Deriv Callback] Verified MT5 account:', {
      derivAccountId: derivAccountId.substring(0, 6) + '...',
      accountType,
      status: accountStatus,
      balance: balance,
      currency: currency,
      server: mt5Server
    });

    // Check if this Deriv account is already connected to another user
    const existingConnection = await DerivAccount.findOne({ derivAccountId });
    if (existingConnection && existingConnection.userId.toString() !== oauthState.userId.toString()) {
      await OAuthState.deleteOne({ state });
      return NextResponse.redirect(
        new URL('/UserDashboard/connect-deriv?error=account_already_connected', process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    // Check if user already has an account of this type connected
    const existingUserAccountType = await DerivAccount.findOne({ 
      userId: oauthState.userId, 
      accountType 
    });

    // Calculate token expiration (Deriv tokens typically expire after a certain time)
    const tokenExpiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

    // Encrypt the access token before storage
    const encryptedAccessToken = encrypt(accessToken);

    // Store or update the Deriv MT5/CFD account connection
    if (existingConnection) {
      // Update existing connection (same account ID)
      existingConnection.accessTokenEncrypted = encryptedAccessToken;
      existingConnection.tokenExpiresAt = tokenExpiresAt;
      existingConnection.connectionStatus = 'connected';
      existingConnection.connectedAt = new Date();
      existingConnection.lastVerifiedAt = new Date();
      existingConnection.balance = balance;
      existingConnection.currency = currency;
      existingConnection.accountStatus = accountStatus;
      existingConnection.accountPlatform = 'mt5';
      existingConnection.product = 'cfd';
      existingConnection.mt5Login = derivAccountId;
      existingConnection.mt5Server = mt5Server;
      existingConnection.mt5AccountType = accountType;
      existingConnection.disconnectedAt = undefined; // Clear disconnect time if reconnecting
      await existingConnection.save();
    } else if (existingUserAccountType) {
      // User already has this account type connected, update it with new MT5 account
      existingUserAccountType.derivAccountId = derivAccountId;
      existingUserAccountType.accessTokenEncrypted = encryptedAccessToken;
      existingUserAccountType.tokenExpiresAt = tokenExpiresAt;
      existingUserAccountType.connectionStatus = 'connected';
      existingUserAccountType.connectedAt = new Date();
      existingUserAccountType.lastVerifiedAt = new Date();
      existingUserAccountType.balance = balance;
      existingUserAccountType.currency = currency;
      existingUserAccountType.accountStatus = accountStatus;
      existingUserAccountType.accountPlatform = 'mt5';
      existingUserAccountType.product = 'cfd';
      existingUserAccountType.mt5Login = derivAccountId;
      existingUserAccountType.mt5Server = mt5Server;
      existingUserAccountType.mt5AccountType = accountType;
      existingUserAccountType.disconnectedAt = undefined;
      await existingUserAccountType.save();
    } else {
      // Create new MT5/CFD connection
      await DerivAccount.create({
        userId: oauthState.userId,
        broker: 'deriv',
        derivAccountId,
        accountType,
        accountPlatform: 'mt5',
        product: 'cfd',
        connectionStatus: 'connected',
        accessTokenEncrypted: encryptedAccessToken,
        tokenExpiresAt,
        connectedAt: new Date(),
        lastVerifiedAt: new Date(),
        balance: balance,
        currency: currency,
        accountStatus: accountStatus,
        mt5Login: derivAccountId,
        mt5Server: mt5Server,
        mt5AccountType: accountType,
      });
    }

    // Update user's active account type to the newly connected account
    const user = await User.findById(oauthState.userId);
    if (user) {
      user.activeDerivAccountType = accountType;
      await user.save();
    }

    // Delete the temporary OAuth state
    await OAuthState.deleteOne({ state });

    // Redirect to the connect-deriv page with success
    return NextResponse.redirect(
      new URL('/UserDashboard/connect-deriv?success=connected', process.env.NEXT_PUBLIC_APP_URL!)
    );

  } catch (error) {
    console.error('Deriv callback error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown',
    });
    return NextResponse.redirect(
      new URL('/UserDashboard/connect-deriv?error=server_error', process.env.NEXT_PUBLIC_APP_URL!)
    );
  }
}

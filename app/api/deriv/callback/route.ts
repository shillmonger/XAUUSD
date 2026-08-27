import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import DerivAccount from '@/models/DerivAccount';
import OAuthState from '@/models/OAuthState';
import { encrypt } from '@/lib/encryption';

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

    // Verify the connected Deriv account using the access token
    const accountResponse = await fetch('https://api.derivws.com/trading/v1/options/accounts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Deriv-App-ID': process.env.DERIV_CLIENT_ID!,
        'Content-Type': 'application/json',
      },
    });

    // Log account verification response
    const accountResponseText = await accountResponse.text();
    console.error('Account verification response:', {
      status: accountResponse.status,
      statusText: accountResponse.statusText,
      contentType: accountResponse.headers.get('content-type'),
      body: accountResponseText.substring(0, 500),
    });

    if (!accountResponse.ok) {
      console.error('Account verification failed:', accountResponse.status, accountResponseText);
      await OAuthState.deleteOne({ state });
      return NextResponse.redirect(
        new URL('/UserDashboard/connect-deriv?error=account_verification_failed', process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    let accountData;
    try {
      accountData = JSON.parse(accountResponseText);
    } catch (error) {
      throw new Error(
        `Deriv returned non-JSON for account. Status: ${accountResponse.status}. ` +
        `Response: ${accountResponseText.slice(0, 300)}`
      );
    }
    
    // The accounts endpoint returns data array with account objects
    if (!accountData.data || !Array.isArray(accountData.data) || accountData.data.length === 0) {
      console.error('Invalid account data received - no accounts found');
      await OAuthState.deleteOne({ state });
      return NextResponse.redirect(
        new URL('/UserDashboard/connect-deriv?error=invalid_account_data', process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    // Select account: prefer active demo, fallback to active real
    const accounts = accountData.data;
    let selectedAccount = accounts.find((acc: any) => 
      acc.status === 'active' && acc.account_type === 'demo'
    );
    
    if (!selectedAccount) {
      selectedAccount = accounts.find((acc: any) => acc.status === 'active' && acc.account_type === 'real');
    }
    
    if (!selectedAccount) {
      console.error('No active accounts found');
      await OAuthState.deleteOne({ state });
      return NextResponse.redirect(
        new URL('/UserDashboard/connect-deriv?error=no_active_account', process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    // Validate required fields
    if (!selectedAccount.account_id || !selectedAccount.account_type) {
      console.error('Selected account missing required fields');
      await OAuthState.deleteOne({ state });
      return NextResponse.redirect(
        new URL('/UserDashboard/connect-deriv?error=invalid_account_data', process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const derivAccountId = selectedAccount.account_id;
    const accountType = selectedAccount.account_type === 'demo' ? 'demo' : 'real';
    const balance = selectedAccount.balance || '0';
    const currency = selectedAccount.currency || 'USD';
    const accountStatus = selectedAccount.status || 'unknown';
    const group = selectedAccount.group || 'unknown';
    
    console.log('Selected Deriv account:', {
      derivAccountId: derivAccountId.substring(0, 8) + '...',
      accountType,
      status: accountStatus,
      balance: balance,
      currency: currency
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

    // Store or update the Deriv account connection
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
      existingConnection.group = group;
      existingConnection.disconnectedAt = undefined; // Clear disconnect time if reconnecting
      await existingConnection.save();
    } else if (existingUserAccountType) {
      // User already has this account type connected, update it with new account
      existingUserAccountType.derivAccountId = derivAccountId;
      existingUserAccountType.accessTokenEncrypted = encryptedAccessToken;
      existingUserAccountType.tokenExpiresAt = tokenExpiresAt;
      existingUserAccountType.connectionStatus = 'connected';
      existingUserAccountType.connectedAt = new Date();
      existingUserAccountType.lastVerifiedAt = new Date();
      existingUserAccountType.balance = balance;
      existingUserAccountType.currency = currency;
      existingUserAccountType.accountStatus = accountStatus;
      existingUserAccountType.group = group;
      existingUserAccountType.disconnectedAt = undefined;
      await existingUserAccountType.save();
    } else {
      // Create new connection
      await DerivAccount.create({
        userId: oauthState.userId,
        broker: 'deriv',
        derivAccountId,
        accountType,
        connectionStatus: 'connected',
        accessTokenEncrypted: encryptedAccessToken,
        tokenExpiresAt,
        connectedAt: new Date(),
        lastVerifiedAt: new Date(),
        balance: balance,
        currency: currency,
        accountStatus: accountStatus,
        group: group,
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

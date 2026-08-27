import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import DerivAccount from '@/models/DerivAccount';
import { verifyToken } from '@/lib/auth';
import { decrypt } from '@/lib/encryption';

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

    // Check if the token has expired
    if (derivAccount.tokenExpiresAt < new Date()) {
      derivAccount.connectionStatus = 'disconnected';
      await derivAccount.save();
      
      return NextResponse.json(
        { error: 'Access token expired, please reconnect' },
        { status: 401 }
      );
    }

    // Decrypt the access token
    let accessToken;
    try {
      accessToken = decrypt(derivAccount.accessTokenEncrypted);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to decrypt access token' },
        { status: 500 }
      );
    }

    // Fetch updated account information from Deriv
    const accountResponse = await fetch('https://api.derivws.com/trading/v1/options/accounts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Deriv-App-ID': process.env.DERIV_CLIENT_ID!,
        'Content-Type': 'application/json',
      },
    });

    if (!accountResponse.ok) {
      console.error('Failed to refresh account data:', accountResponse.status);
      return NextResponse.json(
        { error: 'Failed to fetch account data from Deriv' },
        { status: accountResponse.status }
      );
    }

    const accountResponseText = await accountResponse.text();
    let accountData;
    try {
      accountData = JSON.parse(accountResponseText);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid response from Deriv' },
        { status: 500 }
      );
    }

    // Find the connected account in the response
    if (!accountData.data || !Array.isArray(accountData.data)) {
      return NextResponse.json(
        { error: 'Invalid account data structure' },
        { status: 500 }
      );
    }

    const connectedAccount = accountData.data.find(
      (acc: any) => acc.account_id === derivAccount.derivAccountId
    );

    if (!connectedAccount) {
      return NextResponse.json(
        { error: 'Connected account not found in Deriv response' },
        { status: 404 }
      );
    }

    // Update the account with fresh data
    derivAccount.balance = connectedAccount.balance || derivAccount.balance;
    derivAccount.currency = connectedAccount.currency || derivAccount.currency;
    derivAccount.accountStatus = connectedAccount.status || derivAccount.accountStatus;
    derivAccount.group = connectedAccount.group || derivAccount.group;
    derivAccount.lastVerifiedAt = new Date();
    await derivAccount.save();

    // Return updated account information
    return NextResponse.json({
      success: true,
      accountId: derivAccount.derivAccountId,
      accountType: derivAccount.accountType.toUpperCase(),
      balance: derivAccount.balance,
      currency: derivAccount.currency,
      accountStatus: derivAccount.accountStatus,
      lastVerifiedAt: derivAccount.lastVerifiedAt,
    });

  } catch (error) {
    console.error('Deriv refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh account data' },
      { status: 500 }
    );
  }
}

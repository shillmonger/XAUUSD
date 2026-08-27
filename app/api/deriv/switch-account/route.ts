import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import DerivAccount from '@/models/DerivAccount';
import OAuthState from '@/models/OAuthState';
import { verifyToken } from '@/lib/auth';
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/lib/pkce';

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

    // Validate accountType (case-insensitive)
    const normalizedAccountType = accountType?.toLowerCase().trim();
    if (!normalizedAccountType || !['demo', 'real'].includes(normalizedAccountType)) {
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
      accountType: normalizedAccountType,
      connectionStatus: 'connected'
    });

    if (!targetAccount) {
      // Target account type not connected, initiate OAuth flow to connect it
      // Generate PKCE parameters
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);
      const state = generateState();

      // Store OAuth state with the target account type
      await OAuthState.create({
        userId,
        state,
        codeVerifier,
        codeChallenge,
        targetAccountType: normalizedAccountType,
      });

      // Build Deriv authorization URL
      const derivAuthUrl = new URL('https://auth.deriv.com/oauth2/auth');
      derivAuthUrl.searchParams.append('response_type', 'code');
      derivAuthUrl.searchParams.append('client_id', process.env.DERIV_CLIENT_ID!);
      derivAuthUrl.searchParams.append('redirect_uri', process.env.DERIV_REDIRECT_URI!);
      derivAuthUrl.searchParams.append('scope', 'trade');
      derivAuthUrl.searchParams.append('state', state);
      derivAuthUrl.searchParams.append('code_challenge', codeChallenge);
      derivAuthUrl.searchParams.append('code_challenge_method', 'S256');

      // Return the authorization URL instead of error
      return NextResponse.json({
        needsAuth: true,
        authUrl: derivAuthUrl.toString(),
        message: `No ${normalizedAccountType} account connected. Redirecting to connect...`,
      });
    }

    // Update user's active account type
    user.activeDerivAccountType = normalizedAccountType;
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

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import OAuthState from '@/models/OAuthState';
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/lib/pkce';
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

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Store OAuth state in database
    await OAuthState.create({
      userId,
      state,
      codeVerifier,
      codeChallenge,
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

    // Redirect to Deriv authorization page
    return NextResponse.redirect(derivAuthUrl.toString());

  } catch (error) {
    console.error('Deriv connect error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown',
    });
    return NextResponse.json(
      { error: 'Failed to initiate OAuth connection' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import OAuthState from '@/models/OAuthState';

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

    // Log exchange metadata only. Never write OAuth credentials to logs.
    const responseText = await tokenResponse.text();
    console.info('Token exchange completed:', {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      contentType: tokenResponse.headers.get('content-type'),
      hasAccessToken: responseText.includes('access_token'),
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
    if (!tokenData.access_token) {
      throw new Error('OAuth token response did not contain an access token');
    }

    // OAuth authorizes the Deriv application but does not provide a documented
    // MT5 login, server, balance, or broker execution API. The EA/bridge must
    // register and verify those MT5 details separately.
    console.log('[Deriv Callback] OAuth completed; MT5 bridge verification is required');
    await OAuthState.deleteOne({ state });

    return NextResponse.redirect(
      new URL('/UserDashboard/connect-deriv?success=oauth_authorized', process.env.NEXT_PUBLIC_APP_URL!)
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

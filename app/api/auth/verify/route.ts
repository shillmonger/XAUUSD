import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { sendEmail, getWelcomeEmail } from '@/lib/email';
import { getAppUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Invalid verification link' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find user by email and verification token
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      verificationToken: token 
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification link' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Email already verified' },
        { status: 200 }
      );
    }

    // Update user as verified
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    user.verificationToken = undefined;
    await user.save();

    // Send welcome email
    const appUrl = getAppUrl();
    const dashboardUrl = `${appUrl}/UserDashboard/dashboard`;
    await sendEmail(
      user.email,
      'Your Account Has Been Verified — Welcome to SHILLMONGER',
      getWelcomeEmail(user.userName, dashboardUrl)
    );

    return NextResponse.json(
      { message: 'Email verified successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred during verification' },
      { status: 500 }
    );
  }
}
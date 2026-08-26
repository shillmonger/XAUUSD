import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { hashPassword, generateVerificationToken } from '@/lib/auth';
import { sendEmail, getVerificationEmail } from '@/lib/email';
import { getAppUrl } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, confirmPassword } = await request.json();

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ userName: username });
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Generate random avatar
    const avatarNumber = Math.floor(Math.random() * 33) + 1;
    const avatar = `/PFP_IMG/${avatarNumber}.jfif`;

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Create user
    const user = await User.create({
      userName: username,
      email: email.toLowerCase(),
      passwordHash,
      avatar,
      emailVerified: false,
      verificationToken,
      role: 'user',
      status: 'active',
      agreedToTerms: true,
    });

    // Send verification email
    const appUrl = getAppUrl();
    const verificationUrl = `${appUrl}/auth-page/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    const emailSent = await sendEmail(
      email,
      'Welcome to SHILLMONGER — Verify Your Email Address',
      getVerificationEmail(username, verificationUrl)
    );

    if (!emailSent) {
      console.error('Failed to send verification email to:', email);
    }

    return NextResponse.json(
      { 
        message: 'Account created successfully. Please check your email to verify your account.',
        user: {
          id: user._id,
          username: user.userName,
          email: user.email,
          avatar: user.avatar,
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
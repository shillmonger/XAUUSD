import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import User from '@/models/User';
import connectDB from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { password } = await request.json();

    // Validation - require password confirmation
    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required to delete account' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get user with password hash
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify password before deletion
    const { comparePassword } = await import('@/lib/auth');
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Delete the user account
    await User.findByIdAndDelete(decoded.userId);

    // Clear auth cookie
    const response = NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });

    response.cookies.delete('auth-token');

    return response;
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

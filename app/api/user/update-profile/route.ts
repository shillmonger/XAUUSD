import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import User from '@/models/User';
import connectDB from '@/lib/db';

export async function PATCH(request: NextRequest) {
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

    const { username, phone, country } = await request.json();

    // Validation
    if (!username || username.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (username.trim().length > 30) {
      return NextResponse.json(
        { success: false, error: 'Username cannot exceed 30 characters' },
        { status: 400 }
      );
    }

    // Optional phone validation
    if (phone && phone.trim() && !/^\+?[\d\s-()]+$/.test(phone.trim())) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if username is already taken by another user
    const existingUser = await User.findOne({
      userName: username.trim(),
      _id: { $ne: decoded.userId }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username is already taken' },
        { status: 409 }
      );
    }

    // Update user profile
    const updateData: any = { userName: username.trim() };
    
    if (phone !== undefined) {
      updateData.phone = phone.trim() || null;
    }
    
    if (country !== undefined) {
      updateData.country = country.trim() || null;
    }

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { returnDocument: 'after' }
    ).select('-passwordHash -verificationToken -resetToken -resetTokenExpiry');

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        username: updatedUser.userName,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone,
        country: updatedUser.country,
        emailVerified: updatedUser.emailVerified,
        role: updatedUser.role,
        status: updatedUser.status,
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

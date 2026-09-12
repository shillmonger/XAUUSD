import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import StopLossManagement from '@/models/StopLossManagement';
import User from '@/models/User';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to resolve the Promise
    const { id } = await params;

    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as {
      userId: string;
      email: string;
    };

    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { min_balance, max_balance, stop_loss } = body;

    // Validate input
    if (!min_balance || !max_balance || !stop_loss) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (min_balance >= max_balance) {
      return NextResponse.json(
        { error: 'Minimum balance must be less than maximum balance' },
        { status: 400 }
      );
    }

    // Check for overlapping ranges (excluding current rule)
    const overlappingRule = await StopLossManagement.findOne({
      _id: { $ne: id },
      $or: [
        { min_balance: { $lte: max_balance }, max_balance: { $gte: min_balance } }
      ]
    });

    if (overlappingRule) {
      return NextResponse.json(
        { error: 'Balance range overlaps with existing rule' },
        { status: 400 }
      );
    }

    // Update the stop loss rule
    const updatedRule = await StopLossManagement.findByIdAndUpdate(
      id,
      { min_balance, max_balance, stop_loss },
      { new: true }
    );

    if (!updatedRule) {
      return NextResponse.json(
        { error: 'Stop loss rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Stop loss rule updated successfully', rule: updatedRule },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update stop loss rule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to resolve the Promise
    const { id } = await params;

    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as {
      userId: string;
      email: string;
    };

    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Delete the stop loss rule
    const deletedRule = await StopLossManagement.findByIdAndDelete(id);

    if (!deletedRule) {
      return NextResponse.json(
        { error: 'Stop loss rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Stop loss rule deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete stop loss rule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import PositionLimit from '@/models/PositionLimit';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
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

    // Fetch all position limit rules
    const positionLimits = await PositionLimit.find()
      .sort({ min_balance: 1 })
      .exec();

    return NextResponse.json(
      { positionLimits },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get position limits error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const { min_balance, max_balance, max_positions } = body;

    // Validate input
    if (!min_balance || !max_balance || !max_positions) {
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

    if (max_positions < 1) {
      return NextResponse.json(
        { error: 'Max positions must be at least 1' },
        { status: 400 }
      );
    }

    // Check for overlapping ranges
    const overlappingRule = await PositionLimit.findOne({
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

    // Create new position limit rule
    const newRule = await PositionLimit.create({
      min_balance,
      max_balance,
      max_positions,
      active: true,
    });

    return NextResponse.json(
      { message: 'Position limit rule created successfully', rule: newRule },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create position limit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

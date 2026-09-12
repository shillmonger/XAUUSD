import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import StopLossManagement from '@/models/StopLossManagement';
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

    // Fetch all stop loss rules
    const stopLossRules = await StopLossManagement.find()
      .sort({ min_balance: 1 })
      .exec();

    return NextResponse.json(
      { stopLossRules },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get stop loss rules error:', error);
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

    // Check for overlapping ranges
    const overlappingRule = await StopLossManagement.findOne({
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

    // Create new stop loss rule
    const newRule = await StopLossManagement.create({
      min_balance,
      max_balance,
      stop_loss,
      active: true,
    });

    return NextResponse.json(
      { message: 'Stop loss rule created successfully', rule: newRule },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create stop loss rule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

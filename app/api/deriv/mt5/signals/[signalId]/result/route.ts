/**
 * POST /api/deriv/mt5/signals/[signalId]/result
 *
 * MT5 Expert Advisor execution result callback.
 *
 * After the EA opens (or fails to open) a XAUUSD CFD position, it calls this
 * endpoint to report the outcome. The route:
 *   1. Authenticates the EA via shared secret (x-ea-api-key header).
 *   2. Updates the MT5SignalQueue record with the execution result.
 *   3. Updates the corresponding CopyTrade record with MT5 position details.
 *
 * Authentication:
 *   Header: x-ea-api-key: <MT5_EA_API_KEY from .env.local>
 *
 * Body:
 * {
 *   success: boolean,
 *   positionId?: string,    // MT5 ticket/position ID (on success)
 *   executionPrice?: number, // Actual fill price (on success)
 *   error?: string           // Error message (on failure)
 * }
 *
 * Response 200:
 * { acknowledged: true, signalId, status }
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MT5SignalQueue from '@/models/MT5SignalQueue';
import CopyTrade from '@/models/CopyTrade';

/** Verify the shared EA API key */
function verifyEAKey(request: NextRequest): boolean {
  const key =
    request.headers.get('x-ea-api-key') ||
    request.headers.get('authorization')?.replace('Bearer ', '');
  return key === process.env.MT5_EA_API_KEY;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signalId: string }> }
) {
  if (!verifyEAKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { signalId } = await params;
  if (!signalId) {
    return NextResponse.json({ error: 'signalId is required' }, { status: 400 });
  }

  let body: {
    success: boolean;
    positionId?: string;
    executionPrice?: number;
    error?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.success !== 'boolean') {
    return NextResponse.json({ error: 'success (boolean) field is required' }, { status: 400 });
  }

  await connectDB();

  // Find the queued signal
  const queuedSignal = await MT5SignalQueue.findOne({ signalId });
  if (!queuedSignal) {
    return NextResponse.json({ error: `Signal not found: ${signalId}` }, { status: 404 });
  }

  // Prevent double-reporting
  if (queuedSignal.status === 'executed' || queuedSignal.status === 'expired') {
    return NextResponse.json({
      acknowledged: false,
      signalId,
      status: queuedSignal.status,
      message: 'Signal already in terminal state — ignoring duplicate report',
    });
  }

  const now = new Date();

  if (body.success) {
    // -----------------------------------------------------------------------
    // Successful execution — EA opened the MT5 position
    // -----------------------------------------------------------------------
    queuedSignal.status = 'executed';
    queuedSignal.positionId = body.positionId;
    queuedSignal.executionPrice = body.executionPrice;
    queuedSignal.executedAt = now;
    await queuedSignal.save();

    // Update the CopyTrade record to OPEN with position details
    const copyTrade = await CopyTrade.findOne({
      mt5SignalId: signalId,
    });

    if (copyTrade) {
      copyTrade.status = 'OPEN';
      copyTrade.mt5PositionId = body.positionId;
      copyTrade.mt5EntryPrice = body.executionPrice;
      copyTrade.mt5ExecutionStatus = 'executed';
      copyTrade.openedAt = now;
      await copyTrade.save();
      console.log('[MT5 EA Result] CopyTrade updated to OPEN:', {
        signalId,
        positionId: body.positionId,
        executionPrice: body.executionPrice,
      });
    } else {
      console.warn('[MT5 EA Result] CopyTrade not found for signal:', signalId);
    }

    return NextResponse.json({
      acknowledged: true,
      signalId,
      status: 'executed',
    });

  } else {
    // -----------------------------------------------------------------------
    // Failed execution — EA could not open the position
    // -----------------------------------------------------------------------
    queuedSignal.status = 'failed';
    queuedSignal.executionError = body.error || 'EA reported execution failure';
    queuedSignal.executedAt = now;
    await queuedSignal.save();

    // Update the CopyTrade record to FAILED
    const copyTrade = await CopyTrade.findOne({
      mt5SignalId: signalId,
    });

    if (copyTrade) {
      copyTrade.status = 'FAILED';
      copyTrade.failureReason = body.error || 'EA reported execution failure';
      copyTrade.mt5ExecutionStatus = 'failed';
      await copyTrade.save();
      console.log('[MT5 EA Result] CopyTrade updated to FAILED:', {
        signalId,
        error: body.error,
      });
    }

    return NextResponse.json({
      acknowledged: true,
      signalId,
      status: 'failed',
    });
  }
}

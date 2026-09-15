/**
 * GET /api/deriv/mt5/signals
 *
 * MT5 Expert Advisor polling endpoint.
 *
 * The EA calls this endpoint to retrieve signals that are ready to be
 * executed in MT5. Only 'pending' signals for the authenticated MT5 login
 * are returned.
 *
 * Authentication:
 *   The EA must pass the shared EA_API_KEY header (set in .env.local as MT5_EA_API_KEY).
 *   This is a server-to-server call — no user OAuth token is used here.
 *
 * Query params:
 *   mt5Login  (required) — the MT5 login number the EA is operating on
 *   status    (optional) — filter by status; defaults to 'pending'
 *
 * Response:
 *   { signals: MT5SignalQueue[] }
 *
 * POST /api/deriv/mt5/signals
 *
 * Optionally used by the EA to bulk-acknowledge receipt of signals
 * (transitions them from 'pending' to 'sent').
 *
 * Body: { signalIds: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MT5SignalQueue from '@/models/MT5SignalQueue';

/** Verify the shared EA API key */
function verifyEAKey(request: NextRequest): boolean {
  const key = request.headers.get('x-ea-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  return key === process.env.MT5_EA_API_KEY;
}

// ---------------------------------------------------------------------------
// GET — EA polls for pending signals
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  if (!verifyEAKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const mt5Login = searchParams.get('mt5Login');
  const status = searchParams.get('status') || 'pending';

  if (!mt5Login) {
    return NextResponse.json({ error: 'mt5Login query parameter is required' }, { status: 400 });
  }

  // Validate status value
  const allowedStatuses = ['pending', 'sent', 'executed', 'failed', 'expired'] as const;
  type QueueStatus = typeof allowedStatuses[number];
  if (!allowedStatuses.includes(status as QueueStatus)) {
    return NextResponse.json({ error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` }, { status: 400 });
  }

  await connectDB();

  // Mark expired signals before returning
  const now = new Date();
  await MT5SignalQueue.updateMany(
    { mt5Login, status: 'pending', expiresAt: { $lt: now } },
    { $set: { status: 'expired' } }
  );

  const signals = await MT5SignalQueue.find({ mt5Login, status: status as QueueStatus })
    .sort({ createdAt: 1 })  // Oldest first — FIFO
    .limit(50)
    .lean();

  // Never expose userId or internal IDs to the EA response
  const safeSignals = signals.map((s) => ({
    signalId: s.signalId,
    symbol: s.symbol,
    side: s.side,
    volume: s.volume,
    entryPrice: s.entryPrice ?? null,
    stopLoss: s.stopLoss,
    takeProfit: s.takeProfit,
    accountType: s.accountType,
    mt5Server: s.mt5Server,
    expiresAt: s.expiresAt ?? null,
    createdAt: s.createdAt,
  }));

  return NextResponse.json({ signals: safeSignals, count: safeSignals.length });
}

// ---------------------------------------------------------------------------
// POST — EA acknowledges receipt of signals (marks as 'sent')
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  if (!verifyEAKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { signalIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { signalIds } = body;
  if (!Array.isArray(signalIds) || signalIds.length === 0) {
    return NextResponse.json({ error: 'signalIds array is required' }, { status: 400 });
  }

  await connectDB();

  const result = await MT5SignalQueue.updateMany(
    { signalId: { $in: signalIds }, status: 'pending' },
    { $set: { status: 'sent' } }
  );

  return NextResponse.json({
    acknowledged: result.modifiedCount,
    signalIds,
  });
}

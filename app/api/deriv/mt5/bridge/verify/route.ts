import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import DerivAccount from '@/models/DerivAccount';

function verifyEAKey(request: NextRequest): boolean {
  const key = request.headers.get('x-ea-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  return Boolean(process.env.MT5_EA_API_KEY) && key === process.env.MT5_EA_API_KEY;
}

function hashPairingToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * POST /api/deriv/mt5/bridge/verify
 *
 * The external MT5 EA calls this once after OAuth pairing. It supplies facts
 * read from the running MT5 terminal; no Deriv MT5 API is assumed here.
 */
export async function POST(request: NextRequest) {
  if (!verifyEAKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    pairingToken?: string;
    mt5Login?: string;
    mt5Server?: string;
    accountType?: 'demo' | 'real';
    balance?: number;
    currency?: string;
    accountStatus?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const pairingToken = body.pairingToken?.trim();
  const mt5Login = body.mt5Login?.trim();
  const mt5Server = body.mt5Server?.trim();
  const accountType = body.accountType;

  if (!pairingToken || !mt5Login || !mt5Server || !accountType) {
    return NextResponse.json(
      { error: 'pairingToken, mt5Login, mt5Server, and accountType are required' },
      { status: 400 }
    );
  }

  if (!/^\d+$/.test(mt5Login)) {
    return NextResponse.json({ error: 'mt5Login must be numeric' }, { status: 400 });
  }

  if (/options|multiplier/i.test(mt5Server)) {
    return NextResponse.json({ error: 'Options and Multipliers accounts are not supported' }, { status: 400 });
  }

  if (body.balance !== undefined && (!Number.isFinite(body.balance) || body.balance < 0)) {
    return NextResponse.json({ error: 'balance must be a non-negative number' }, { status: 400 });
  }

  await connectDB();

  const pendingAccount = await DerivAccount.findOne({
    bridgePairingTokenHash: hashPairingToken(pairingToken),
    accountPlatform: 'mt5',
    product: 'cfd',
    connectionStatus: 'pending',
  }).select('+bridgePairingTokenHash');

  if (!pendingAccount) {
    return NextResponse.json({ error: 'Invalid or expired bridge pairing token' }, { status: 404 });
  }

  if (pendingAccount.accountType !== accountType) {
    return NextResponse.json({ error: 'MT5 account type does not match the OAuth connection' }, { status: 400 });
  }

  const existingAccount = await DerivAccount.findOne({
    derivAccountId: mt5Login,
    _id: { $ne: pendingAccount._id },
  });

  if (existingAccount && existingAccount.userId.toString() !== pendingAccount.userId.toString()) {
    return NextResponse.json({ error: 'This MT5 account is already connected to another user' }, { status: 409 });
  }

  pendingAccount.derivAccountId = mt5Login;
  pendingAccount.mt5Login = mt5Login;
  pendingAccount.mt5Server = mt5Server;
  pendingAccount.mt5AccountType = accountType;
  pendingAccount.balance = body.balance?.toString();
  pendingAccount.currency = body.currency || 'USD';
  pendingAccount.accountStatus = body.accountStatus || 'active';
  pendingAccount.connectionStatus = 'connected';
  pendingAccount.connectedAt = new Date();
  pendingAccount.lastVerifiedAt = new Date();
  pendingAccount.bridgePairingTokenHash = undefined;
  await pendingAccount.save();

  return NextResponse.json({
    verified: true,
    accountId: pendingAccount.derivAccountId,
    accountType: pendingAccount.accountType,
    accountPlatform: pendingAccount.accountPlatform,
    product: pendingAccount.product,
    mt5Server: pendingAccount.mt5Server,
    balance: pendingAccount.balance,
    currency: pendingAccount.currency,
  });
}


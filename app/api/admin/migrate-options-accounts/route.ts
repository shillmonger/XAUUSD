/**
 * POST /api/admin/migrate-options-accounts
 *
 * One-time migration route.
 *
 * Finds every DerivAccount in the database whose accountPlatform is
 * 'options' or 'unknown' (i.e. legacy records created before the
 * MT5/CFD migration), and marks them as 'invalid' so users are
 * prompted to reconnect with their actual Deriv MT5/CFD account.
 *
 * This must be called ONCE after deploying the migration.
 * It is idempotent — running it multiple times is safe.
 *
 * Authentication: Admin-only. Requires ADMIN_API_KEY header.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import DerivAccount from '@/models/DerivAccount';

export async function POST(request: NextRequest) {
  // Admin-only — require the server-to-server admin key
  const key =
    request.headers.get('x-admin-api-key') ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  // Find all accounts that are not MT5/CFD
  const legacyAccounts = await DerivAccount.find({
    $or: [
      { accountPlatform: 'options' },
      { accountPlatform: 'unknown' },
      { product: 'options' },
      { product: 'multipliers' },
      // Catch old records that have an Options-style account ID (e.g. DOT..., CR...)
      // but are NOT already marked invalid
      {
        connectionStatus: { $ne: 'invalid' },
        mt5Login: { $exists: false },
        accountPlatform: { $ne: 'mt5' },
      },
    ],
  });

  const results = {
    inspected: legacyAccounts.length,
    markedInvalid: 0,
    alreadyInvalid: 0,
    skipped: 0,
  };

  for (const account of legacyAccounts) {
    if (account.connectionStatus === 'invalid') {
      results.alreadyInvalid++;
      continue;
    }

    console.log('[Options Migration] Marking account as invalid:', {
      derivAccountId: account.derivAccountId.substring(0, 8) + '...',
      accountPlatform: account.accountPlatform,
      product: account.product,
      connectionStatus: account.connectionStatus,
    });

    account.connectionStatus = 'invalid';
    account.accountPlatform = account.accountPlatform === 'mt5' ? 'mt5' : 'options';
    account.product = account.product === 'cfd' ? 'cfd' : 'options';
    account.botStatus = 'OFF';

    try {
      await account.save();
      results.markedInvalid++;
    } catch (err) {
      console.error('[Options Migration] Failed to update account:', err);
      results.skipped++;
    }
  }

  console.log('[Options Migration] Complete:', results);

  return NextResponse.json({
    success: true,
    message:
      'Options/legacy account migration complete. Affected users must reconnect their Deriv MT5/CFD account.',
    results,
  });
}
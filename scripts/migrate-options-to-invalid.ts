/**
 * Migration Function: Mark Existing Options Accounts as Invalid
 * 
 * This function:
 * - Finds all existing DerivAccount records without platform/product fields
 * - Marks them as 'options' platform and 'invalid' status
 * - Prevents them from being used for MT5/CFD trading
 * - Users must reconnect with actual MT5/CFD accounts
 * 
 * This should be called during application startup or in a migration script.
 */

import DerivAccount from '@/models/DerivAccount';

export async function migrateOptionsAccounts() {
  try {
    console.log('[Migration] Starting Options account migration...');

    // Find all accounts without platform field or with unknown platform
    const accountsToMigrate = await DerivAccount.find({
      $or: [
        { accountPlatform: { $exists: false } },
        { accountPlatform: 'unknown' },
        { accountPlatform: 'options' }
      ]
    });

    console.log(`[Migration] Found ${accountsToMigrate.length} accounts to migrate`);

    if (accountsToMigrate.length === 0) {
      console.log('[Migration] No accounts need migration');
      return { migrated: 0, total: 0 };
    }

    // Update each account
    let migratedCount = 0;
    for (const account of accountsToMigrate) {
      console.log(`[Migration] Processing account: ${account.derivAccountId.substring(0, 8)}...`);
      
      // Mark as Options platform and invalid status
      account.accountPlatform = 'options';
      account.product = 'options';
      account.connectionStatus = 'invalid';
      
      await account.save();
      migratedCount++;
      
      console.log(`[Migration] Migrated account: ${account.derivAccountId.substring(0, 8)}... -> platform=options, status=invalid`);
    }

    console.log(`[Migration] Successfully migrated ${migratedCount} accounts`);
    console.log('[Migration] Users must reconnect with actual MT5/CFD accounts');

    return { migrated: migratedCount, total: accountsToMigrate.length };

  } catch (error) {
    console.error('[Migration] Error during migration:', error);
    throw error;
  }
}
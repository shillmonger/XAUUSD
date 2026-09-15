/**
 * Migration Library
 * Handles database migrations for the application
 * 
 * This can be called during application startup to ensure
 * database schema is up to date and existing data is migrated.
 */

import DerivAccount from '@/models/DerivAccount';

export async function runMigrations() {
  try {
    console.log('[Migration] Checking for required migrations...');

    // Run Options account migration
    await migrateOptionsAccounts();

    console.log('[Migration] All migrations completed successfully');
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    // Don't throw - allow application to start even if migration fails
    // Admin can manually fix migration issues
  }
}

/**
 * Mark existing Options accounts as invalid for MT5/CFD trading
 */
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
/**
 * Standalone Migration Script
 * Run this directly with: node scripts/run-migration.js
 * 
 * This script marks existing Options accounts as invalid for MT5/CFD trading
 */

const mongoose = require('mongoose');

// MongoDB connection string - update this to match your environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xau-prime';

// Simple DerivAccount schema for migration
const DerivAccountSchema = new mongoose.Schema({
  derivAccountId: String,
  accountPlatform: String,
  product: String,
  connectionStatus: String,
}, { strict: false });

const DerivAccount = mongoose.model('DerivAccount', DerivAccountSchema);

async function runMigration() {
  try {
    console.log('[Migration] Starting Options account migration...');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('[Migration] Database connected');

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
      return;
    }

    // Update each account
    let migratedCount = 0;
    for (const account of accountsToMigrate) {
      console.log(`[Migration] Processing account: ${account.derivAccountId?.substring(0, 8) || 'unknown'}...`);
      
      // Mark as Options platform and invalid status
      account.accountPlatform = 'options';
      account.product = 'options';
      account.connectionStatus = 'invalid';
      
      await account.save();
      migratedCount++;
      
      console.log(`[Migration] Migrated account: ${account.derivAccountId?.substring(0, 8) || 'unknown'}... -> platform=options, status=invalid`);
    }

    console.log(`[Migration] Successfully migrated ${migratedCount} accounts`);
    console.log('[Migration] Users must reconnect with actual MT5/CFD accounts');

  } catch (error) {
    console.error('[Migration] Error during migration:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('[Migration] Database connection closed');
    process.exit(0);
  }
}

// Run the migration
runMigration();
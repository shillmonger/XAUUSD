/**
 * Database Migration Script
 * Migrates existing Signal, TradeParameters, and CopyTrade records
 * from Options-based field names to Multipliers-based field names
 * 
 * Separates historical Options data from new Multipliers data
 */

import mongoose from 'mongoose';
import Signal from '../models/Signal';
import TradeParameters from '../models/TradeParameters';
import CopyTrade from '../models/CopyTrade';

/**
 * Migrate Signal records
 * Renames: symbol → asset, orderType → sourceOrderType, entry → sourceEntryPrice, lotSize → stake
 */
export async function migrateSignalRecords(): Promise<void> {
  console.log('[Migration] Starting Signal record migration...');
  
  try {
    const result = await Signal.updateMany(
      {},  // Match all documents
      {
        $rename: {
          symbol: 'asset',
          orderType: 'sourceOrderType',
          entry: 'sourceEntryPrice',
          lotSize: 'stake'
        }
      },
      {}  // Options (empty)
    );
    
    console.log(`[Migration] Migrated ${result.modifiedCount} Signal records`);
  } catch (error) {
    console.error('[Migration] Signal migration failed:', error);
    throw error;
  }
}

/**
 * Migrate TradeParameters records
 * Renames: telegramLotSize → telegramStake, configuredLotSize → configuredStake
 * Renames: finalLotSize → finalStake
 * Adds: configuredMultiplier, configuredMaxRiskAmount, finalMultiplier, finalCurrency, finalTakeProfitIndex
 */
export async function migrateTradeParametersRecords(): Promise<void> {
  console.log('[Migration] Starting TradeParameters record migration...');
  
  try {
    const result = await TradeParameters.updateMany(
      {},  // Match all documents
      {
        $rename: {
          telegramLotSize: 'telegramStake',
          configuredLotSize: 'configuredStake',
          finalLotSize: 'finalStake'
        }
      },
      {}  // Options (empty)
    );
    
    console.log(`[Migration] Migrated ${result.modifiedCount} TradeParameters records`);
  } catch (error) {
    console.error('[Migration] TradeParameters migration failed:', error);
    throw error;
  }
}

/**
 * Migrate CopyTrade records
 * Renames: symbol → asset, orderType → sourceOrderType, requestedEntry → sourceEntryPrice
 * Renames: lotSize → stake, brokerContractId → contractId
 * Adds: Separation of historical Options data and new Multipliers data
 */
export async function migrateCopyTradeRecords(): Promise<void> {
  console.log('[Migration] Starting CopyTrade record migration...');
  
  try {
    // Step 1: Rename fields
    const renameResult = await CopyTrade.updateMany(
      {},  // Match all documents
      {
        $rename: {
          symbol: 'asset',
          orderType: 'sourceOrderType',
          requestedEntry: 'sourceEntryPrice',
          lotSize: 'stake',
          brokerContractId: 'contractId'
        }
      },
      {}  // Options (empty)
    );
    
    console.log(`[Migration] Renamed fields in ${renameResult.modifiedCount} CopyTrade records`);
    
    // Step 2: Separate historical Options data
    // Historical Options records get legacyDerivContractType, new derivContractType set to null
    const legacyResult = await CopyTrade.updateMany(
      { status: { $in: ['OPEN', 'CLOSED', 'FAILED'] } },
      [
        {
          $set: {
            // Historical Options data to legacy field
            legacyDerivContractType: {
              $cond: [
                { $eq: ['$direction', 'BUY'] },
                'CALL',
                'PUT'
              ]
            },
            // New field left null for historical records
            derivContractType: null
          }
        }
      ]
    );
    
    console.log(`[Migration] Separated historical Options data in ${legacyResult.modifiedCount} CopyTrade records`);
    
  } catch (error) {
    console.error('[Migration] CopyTrade migration failed:', error);
    throw error;
  }
}

/**
 * Run all migrations
 */
export async function runAllMigrations(): Promise<void> {
  console.log('[Migration] Starting all database migrations...');
  
  try {
    await migrateSignalRecords();
    await migrateTradeParametersRecords();
    await migrateCopyTradeRecords();
    
    console.log('[Migration] All migrations completed successfully');
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    throw error;
  }
}

/**
 * Rollback Signal migration (for testing/rollback purposes)
 */
export async function rollbackSignalMigration(): Promise<void> {
  console.log('[Migration] Rolling back Signal migration...');
  
  try {
    const result = await Signal.updateMany(
      {},
      {
        $rename: {
          asset: 'symbol',
          sourceOrderType: 'orderType',
          sourceEntryPrice: 'entry',
          stake: 'lotSize'
        }
      },
      {}
    );
    
    console.log(`[Migration] Rolled back ${result.modifiedCount} Signal records`);
  } catch (error) {
    console.error('[Migration] Signal rollback failed:', error);
    throw error;
  }
}

/**
 * Rollback TradeParameters migration
 */
export async function rollbackTradeParametersMigration(): Promise<void> {
  console.log('[Migration] Rolling back TradeParameters migration...');
  
  try {
    const result = await TradeParameters.updateMany(
      {},
      {
        $rename: {
          telegramStake: 'telegramLotSize',
          configuredStake: 'configuredLotSize',
          finalStake: 'finalLotSize'
        }
      },
      {}
    );
    
    console.log(`[Migration] Rolled back ${result.modifiedCount} TradeParameters records`);
  } catch (error) {
    console.error('[Migration] TradeParameters rollback failed:', error);
    throw error;
  }
}

/**
 * Rollback CopyTrade migration
 */
export async function rollbackCopyTradeMigration(): Promise<void> {
  console.log('[Migration] Rolling back CopyTrade migration...');
  
  try {
    const result = await CopyTrade.updateMany(
      {},
      {
        $rename: {
          asset: 'symbol',
          sourceOrderType: 'orderType',
          sourceEntryPrice: 'requestedEntry',
          stake: 'lotSize',
          contractId: 'brokerContractId'
        }
      },
      {}
    );
    
    console.log(`[Migration] Rolled back ${result.modifiedCount} CopyTrade records`);
  } catch (error) {
    console.error('[Migration] CopyTrade rollback failed:', error);
    throw error;
  }
}

// If run directly, execute migrations
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'migrate') {
    runAllMigrations()
      .then(() => {
        console.log('[Migration] Migration complete');
        process.exit(0);
      })
      .catch((error) => {
        console.error('[Migration] Migration failed:', error);
        process.exit(1);
      });
  } else if (command === 'rollback') {
    Promise.all([
      rollbackSignalMigration(),
      rollbackTradeParametersMigration(),
      rollbackCopyTradeMigration()
    ])
      .then(() => {
        console.log('[Migration] Rollback complete');
        process.exit(0);
      })
      .catch((error) => {
        console.error('[Migration] Rollback failed:', error);
        process.exit(1);
      });
  } else {
    console.log('[Migration] Usage: node migrate-to-multipliers.ts [migrate|rollback]');
    process.exit(1);
  }
}

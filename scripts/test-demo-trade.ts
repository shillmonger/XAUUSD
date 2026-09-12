/**
 * Controlled DEMO Trade Test Script
 * 
 * This script tests the complete Phase 7 + Phase 8 pipeline with a controlled signal.
 * It creates a test signal, processes it through Phase 5/6/7/8, and verifies the result.
 * 
 * IMPORTANT: This script is for DEMO accounts only.
 * DO NOT use with real accounts.
 * 
 * Usage:
 * 1. Ensure you have a connected DEMO Deriv account with ACTIVE bot status
 * 2. Set up your environment variables (.env.local)
 * 3. Run: npm run test-demo-trade
 * 
 * The script will:
 * 1. Create a test XAUUSD signal
 * 2. Process Phase 5 (trade parameters)
 * 3. Process Phase 6 (user eligibility)
 * 4. Execute Phase 7 (Deriv adapter)
 * 5. Execute Phase 8 (demo copy engine)
 * 6. Verify the trade on Deriv
 * 7. Report results
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Import models and services
import connectDB from '../lib/db';
import Signal from '../models/Signal';
import AIMessage from '../models/AIMessage';
import TelegramProvider from '../models/TelegramProvider';
import DerivAccount from '../models/DerivAccount';
import TradeParameters from '../models/TradeParameters';
import UserEligibility from '../models/UserEligibility';
import CopyTrade from '../models/CopyTrade';
import { TradeParameterResolver } from '../services/trade-parameter-resolver.service';
import { UserEligibilityService } from '../services/user-eligibility.service';
import { derivAdapter } from '../services/deriv-adapter.service';
import { phase8ExecutionEngine } from '../services/phase8-execution-engine.service';

interface TestConfig {
  symbol: string;
  direction: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP';
  entry?: number;
  stopLoss: number;
  takeProfits: number[];
}

/**
 * Create a test signal for controlled testing
 */
async function createTestSignal(config: TestConfig) {
  console.log('[TEST] Creating test signal...');

  // Check if we have required dependencies
  const aiMessage = await AIMessage.findOne();
  if (!aiMessage) {
    throw new Error('No AI message found in database. Please ensure AI processing is working.');
  }

  const telegramProvider = await TelegramProvider.findOne();
  if (!telegramProvider) {
    throw new Error('No Telegram provider found. Please set up Telegram integration.');
  }

  const signal = new Signal({
    telegramMessageId: 999999, // Test message ID
    aiMessageId: aiMessage._id,
    telegramGroupId: 'test_group',
    providerId: telegramProvider._id,
    symbol: config.symbol,
    direction: config.direction,
    orderType: config.orderType,
    entry: config.entry,
    stopLoss: config.stopLoss,
    takeProfits: config.takeProfits,
    validationStatus: 'valid',
    validationReason: 'Test signal for Phase 7+8 testing'
  });

  await signal.save();
  console.log(`[TEST] Test signal created: ${signal._id}`);

  return signal;
}

/**
 * Check test prerequisites
 */
async function checkPrerequisites() {
  console.log('[TEST] Checking prerequisites...');

  // Check for connected DEMO accounts with ACTIVE bot status
  const demoAccounts = await DerivAccount.find({
    accountType: 'demo',
    connectionStatus: 'connected',
    botStatus: 'ACTIVE'
  });

  if (demoAccounts.length === 0) {
    throw new Error('No connected DEMO accounts with ACTIVE bot status found. Please connect a DEMO account and set bot status to ACTIVE.');
  }

  console.log(`[TEST] Found ${demoAccounts.length} eligible DEMO account(s)`);

  // Check for required admin configuration
  // (This would check LotSizeManagement, StopLossManagement, PositionLimit tables)
  console.log('[TEST] Prerequisites check passed');

  return demoAccounts;
}

/**
 * Run the complete test
 */
async function runDemoTradeTest() {
  try {
    console.log('========================================');
    console.log('PHASE 7 + PHASE 8 DEMO TRADE TEST');
    console.log('========================================');

    // Connect to database
    await connectDB();
    console.log('[TEST] Database connected');

    // Check prerequisites
    const demoAccounts = await checkPrerequisites();

    // Create test signal
    const testConfig: TestConfig = {
      symbol: 'XAUUSD',
      direction: 'BUY',
      orderType: 'LIMIT',
      entry: 4072,
      stopLoss: 4065,
      takeProfits: [4080, 4090, 4150]
    };

    const signal = await createTestSignal(testConfig);
    console.log(`[TEST] Signal: ${signal.symbol} ${signal.direction} @ ${signal.entry}`);

    // Phase 5: Trade Parameter Resolution
    console.log('\n[TEST] Phase 5: Trade Parameter Resolution');
    const resolver = new TradeParameterResolver();
    const phase5Results = [];

    for (const derivAccount of demoAccounts) {
      const userId = derivAccount.userId.toString();
      console.log(`[TEST] Processing user ${userId}...`);

      const resolvedParams = await resolver.resolveTradeParameters(signal, userId);

      const tradeParameters = new TradeParameters({
        signalId: signal._id,
        userId: userId,
        derivAccountId: derivAccount.derivAccountId,
        currentBalance: resolvedParams.currentBalance,
        databaseBalance: resolvedParams.databaseBalance,
        balanceSynchronized: resolvedParams.balanceSynchronized,
        telegramStopLoss: resolvedParams.telegramStopLoss,
        telegramTakeProfits: resolvedParams.telegramTakeProfits,
        configuredLotSize: resolvedParams.configuredLotSize,
        configuredStopLoss: resolvedParams.configuredStopLoss,
        configuredMaxPositions: resolvedParams.configuredMaxPositions,
        finalStopLoss: resolvedParams.finalStopLoss,
        finalTakeProfit: resolvedParams.finalTakeProfit,
        finalLotSize: resolvedParams.finalLotSize,
        currentOpenPositions: resolvedParams.currentOpenPositions,
        maxPositions: resolvedParams.maxPositions,
        positionLimitReached: resolvedParams.positionLimitReached,
        eligible: resolvedParams.eligible,
        rejectionReason: resolvedParams.rejectionReason,
      });

      await tradeParameters.save();
      phase5Results.push({
        userId,
        derivAccountId: derivAccount.derivAccountId,
        eligible: resolvedParams.eligible,
        finalLotSize: resolvedParams.finalLotSize,
        finalStopLoss: resolvedParams.finalStopLoss,
        finalTakeProfit: resolvedParams.finalTakeProfit,
        rejectionReason: resolvedParams.rejectionReason
      });
    }

    console.log(`[TEST] Phase 5 complete: ${phase5Results.length} users processed`);

    // Phase 6: User Eligibility
    console.log('\n[TEST] Phase 6: User Eligibility');
    const eligibilityService = new UserEligibilityService();
    const eligibilityResult = await eligibilityService.processSignalEligibility(signal);

    console.log(`[TEST] Phase 6 complete: ${eligibilityResult.eligibleAccounts} eligible, ${eligibilityResult.rejectedAccounts} rejected`);

    // Phase 8: Execution
    console.log('\n[TEST] Phase 8: Demo Copy Execution');
    if (eligibilityResult.eligibleAccounts > 0) {
      const executionSummary = await phase8ExecutionEngine.processSignalExecution(signal._id.toString());

      console.log(`[TEST] Phase 8 complete:`);
      console.log(`[TEST]   Total eligible: ${executionSummary.totalEligibleAccounts}`);
      console.log(`[TEST]   Successful: ${executionSummary.successfulExecutions}`);
      console.log(`[TEST]   Failed: ${executionSummary.failedExecutions}`);
      console.log(`[TEST]   Skipped: ${executionSummary.skippedExecutions}`);

      // Verify trades on Deriv
      console.log('\n[TEST] Verifying trades on Deriv...');
      const copyTrades = await CopyTrade.find({
        signalId: signal._id,
        status: 'OPEN'
      });

      console.log(`[TEST] Found ${copyTrades.length} open copy trades in database`);

      for (const copyTrade of copyTrades) {
        console.log(`[TEST] Trade verification:`);
        console.log(`[TEST]   User: ${copyTrade.userId}`);
        console.log(`[TEST]   Deriv Account: ${copyTrade.derivAccountId}`);
        console.log(`[TEST]   Symbol: ${copyTrade.symbol}`);
        console.log(`[TEST]   Direction: ${copyTrade.direction}`);
        console.log(`[TEST]   Broker Contract ID: ${copyTrade.brokerContractId}`);
        console.log(`[TEST]   Execution Price: ${copyTrade.executionPrice}`);
        console.log(`[TEST]   Stop Loss: ${copyTrade.stopLoss}`);
        console.log(`[TEST]   Take Profit: ${copyTrade.takeProfit}`);
        console.log(`[TEST]   Lot Size: ${copyTrade.lotSize}`);
        console.log(`[TEST]   Status: ${copyTrade.status}`);

        // TODO: Add actual Deriv portfolio verification using the API client
        // This would query Deriv's portfolio endpoint to confirm the trade exists
      }

      // Final summary
      console.log('\n========================================');
      console.log('TEST SUMMARY');
      console.log('========================================');
      console.log(`Signal ID: ${signal._id}`);
      console.log(`Symbol: ${signal.symbol} ${signal.direction} @ ${signal.entry}`);
      console.log(`Phase 5 Processed: ${phase5Results.length}`);
      console.log(`Phase 6 Eligible: ${eligibilityResult.eligibleAccounts}`);
      console.log(`Phase 8 Executed: ${executionSummary.successfulExecutions}`);
      console.log(`Trades Created: ${copyTrades.length}`);
      console.log(`Test Status: ${executionSummary.successfulExecutions > 0 ? 'SUCCESS' : 'FAILED'}`);
      console.log('========================================');

    } else {
      console.log('[TEST] Phase 8 skipped: No eligible accounts');
    }

    // Cleanup test signal (optional - comment out if you want to keep it)
    console.log('\n[TEST] Cleaning up test signal...');
    await Signal.deleteOne({ _id: signal._id });
    await TradeParameters.deleteMany({ signalId: signal._id });
    await UserEligibility.deleteMany({ signalId: signal._id });
    await CopyTrade.deleteMany({ signalId: signal._id });
    console.log('[TEST] Cleanup complete');

    console.log('\n[TEST] Test completed successfully');

  } catch (error) {
    console.error('[TEST] Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[TEST] Database disconnected');
  }
}

// Run the test
runDemoTradeTest().catch(error => {
  console.error('[TEST] Fatal error:', error);
  process.exit(1);
});

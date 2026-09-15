import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Signal from '@/models/Signal';
import User from '@/models/User';
import DerivAccount from '@/models/DerivAccount';
import TradeParameters from '@/models/TradeParameters';
import { TradeParameterResolver } from '@/services/trade-parameter-resolver.service';
import { UserEligibilityService } from '@/services/user-eligibility.service';
import { phase8ExecutionEngine } from '@/services/phase8-execution-engine.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signalId: string }> }
) {
  try {
    const { signalId } = await params;
    
    console.log(`[Signal Processing] Starting processing for signal ${signalId}`);
    
    // Connect to database
    await connectDB();
    
    // Find the signal
    const signal = await Signal.findById(signalId);
    
    if (!signal) {
      return NextResponse.json(
        { error: 'Signal not found' },
        { status: 404 }
      );
    }
    
    // Only process valid signals
    if (signal.validationStatus !== 'valid') {
      return NextResponse.json(
        { error: 'Signal is not valid' },
        { status: 400 }
      );
    }
    
    // Check if this signal has already been processed
    const existingProcessing = await TradeParameters.findOne({ signalId });
    if (existingProcessing) {
      return NextResponse.json(
        { error: 'Signal already processed' },
        { status: 400 }
      );
    }
    
    // Get all DEMO users with connected Deriv accounts with active bot status
    // Phase 5 and Phase 6 only process demo accounts for now
    const derivAccounts = await DerivAccount.find({
      accountType: 'demo', // Only process demo accounts
      connectionStatus: 'connected',
      botStatus: 'ACTIVE' // Only process accounts with active bot status
    });
    
    console.log(`[Signal Processing] Found ${derivAccounts.length} eligible user accounts`);
    
    if (derivAccounts.length === 0) {
      return NextResponse.json({
        message: 'No eligible user accounts found',
        processedCount: 0,
      });
    }
    
    const resolver = new TradeParameterResolver();
    let processedCount = 0;
    let eligibleCount = 0;
    const results: any[] = [];
    
    // Process each user's account
    for (const derivAccount of derivAccounts) {
      const userId = derivAccount.userId.toString();
      
      console.log(`[Signal Processing] Processing for user ${userId}, account ${derivAccount.derivAccountId}`);
      
      try {
        // Resolve trade parameters for this user
        const resolvedParams = await resolver.resolveTradeParameters(signal, userId);
        
        // Store the resolved parameters
        const tradeParameters = new TradeParameters({
          signalId: signal._id,
          userId: userId,
          derivAccountId: derivAccount.derivAccountId,
          currentBalance: resolvedParams.currentBalance,
          databaseBalance: resolvedParams.databaseBalance,
          balanceSynchronized: resolvedParams.balanceSynchronized,
          telegramStopLoss: resolvedParams.telegramStopLoss,
          telegramTakeProfits: resolvedParams.telegramTakeProfits,
          telegramStake: resolvedParams.telegramStake,
          configuredStake: resolvedParams.configuredStake,
          configuredStopLoss: resolvedParams.configuredStopLoss,
          configuredMaxPositions: resolvedParams.configuredMaxPositions,
          finalStopLoss: resolvedParams.finalStopLoss,
          finalTakeProfit: resolvedParams.finalTakeProfit,
          finalStake: resolvedParams.finalStake,
          currentOpenPositions: resolvedParams.currentOpenPositions,
          maxPositions: resolvedParams.maxPositions,
          positionLimitReached: resolvedParams.positionLimitReached,
          eligible: resolvedParams.eligible,
          rejectionReason: resolvedParams.rejectionReason,
        });
        
        await tradeParameters.save();
        processedCount++;
        
        if (resolvedParams.eligible) {
          eligibleCount++;
          console.log(`[Signal Processing] User ${userId} is ELIGIBLE for trade`);
          
          // TODO: Pass to execution layer when it exists
          // For now, just log the final parameters
          results.push({
            userId: userId.toString(),
            derivAccountId: derivAccount.derivAccountId,
            eligible: true,
            finalParameters: {
              sourceEntryPrice: signal.sourceEntryPrice,
              direction: signal.direction,
              sourceOrderType: signal.sourceOrderType,
              stake: resolvedParams.finalStake,
              stopLoss: resolvedParams.finalStopLoss,
              takeProfit: resolvedParams.finalTakeProfit,
            }
          });
        } else {
          console.log(`[Signal Processing] User ${userId} is NOT eligible: ${resolvedParams.rejectionReason}`);
          results.push({
            userId: userId.toString(),
            derivAccountId: derivAccount.derivAccountId,
            eligible: false,
            rejectionReason: resolvedParams.rejectionReason,
          });
        }
        
      } catch (userError: any) {
        console.error(`[Signal Processing] Error processing for user ${userId}:`, userError.message);
        results.push({
          userId: userId.toString(),
          derivAccountId: derivAccount.derivAccountId,
          eligible: false,
          rejectionReason: 'PROCESSING_ERROR',
          error: userError.message,
        });
      }
    }
    
    console.log(`[Signal Processing] Phase 5 completed: ${processedCount} processed, ${eligibleCount} eligible`);
    
    // Phase 6: User Eligibility Check (demo accounts only)
    console.log(`[Signal Processing] Starting Phase 6 eligibility check`);
    const eligibilityService = new UserEligibilityService();
    const eligibilityResult = await eligibilityService.processSignalEligibility(signal);
    
    console.log(`[Signal Processing] Phase 6 completed: demoProcessed=${eligibilityResult.demoAccountsProcessed}, realIgnored=${eligibilityResult.realAccountsIgnored}, eligible=${eligibilityResult.eligibleAccounts}, rejected=${eligibilityResult.rejectedAccounts}`);
    
    // Phase 8: Execute trades for eligible demo accounts
    console.log(`[Signal Processing] Starting Phase 8 execution`);
    let phase8Result = null;
    
    if (eligibilityResult.eligibleAccounts > 0) {
      try {
        phase8Result = await phase8ExecutionEngine.processSignalExecution(signalId);
        console.log(`[Signal Processing] Phase 8 completed: total=${phase8Result.totalEligibleAccounts}, success=${phase8Result.successfulExecutions}, failed=${phase8Result.failedExecutions}, skipped=${phase8Result.skippedExecutions}`);
      } catch (phase8Error) {
        console.error(`[Signal Processing] Phase 8 execution failed:`, phase8Error);
        phase8Result = {
          error: phase8Error instanceof Error ? phase8Error.message : 'UNKNOWN_ERROR',
          totalEligibleAccounts: eligibilityResult.eligibleAccounts,
          successfulExecutions: 0,
          failedExecutions: eligibilityResult.eligibleAccounts,
          skippedExecutions: 0,
        };
      }
    } else {
      console.log(`[Signal Processing] Phase 8 skipped: no eligible accounts`);
    }
    
    return NextResponse.json({
      message: 'Signal processing completed',
      signalId: signalId,
      phase5: {
        processedCount,
        eligibleCount,
        results,
      },
      phase6: {
        demoAccountsProcessed: eligibilityResult.demoAccountsProcessed,
        realAccountsIgnored: eligibilityResult.realAccountsIgnored,
        eligibleAccounts: eligibilityResult.eligibleAccounts,
        rejectedAccounts: eligibilityResult.rejectedAccounts,
        eligibilityResults: eligibilityResult.results,
      },
      phase8: phase8Result ? {
        totalEligibleAccounts: phase8Result.totalEligibleAccounts,
        successfulExecutions: phase8Result.successfulExecutions,
        failedExecutions: phase8Result.failedExecutions,
        skippedExecutions: phase8Result.skippedExecutions,
        executionResults: phase8Result.executionResults,
      } : null,
    });
    
  } catch (error) {
    console.error('[Signal Processing] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process signal: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
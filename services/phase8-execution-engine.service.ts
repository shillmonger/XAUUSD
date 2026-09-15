/**
 * Phase 8 Execution Engine Service
 * Orchestrates copy trade execution for eligible demo users
 * 
 * This service:
 * - Retrieves eligible demo accounts from Phase 6
 * - Executes trades independently for each user using their own Deriv MT5/CFD account
 * - Uses Phase 5 final trade parameters (SL, TP, lot size)
 * - Respects position limits from Phase 5
 * - Enforces demo-only execution (real accounts are blocked)
 * - Prevents duplicate execution
 * - Orchestrates the complete pipeline: Phase 6 → Phase 7 → MT5 → CopyTrade
 * - Handles execution failures gracefully
 * - Does NOT implement subscription logic (demo only for now)
 * 
 * UPDATED: Now uses MT5/CFD architecture instead of Options/Multipliers
 */

import mongoose from 'mongoose';
import Signal from '@/models/Signal';
import TradeParameters from '@/models/TradeParameters';
import UserEligibility from '@/models/UserEligibility';
import { mt5Adapter, InternalTradeRequest, ExecutionResult, MT5Adapter } from './mt5-adapter.service';
import { ISignal } from '@/models/Signal';

export interface ExecutionSummary {
  signalId: string;
  totalEligibleAccounts: number;
  successfulExecutions: number;
  failedExecutions: number;
  skippedExecutions: number;
  executionResults: Array<{
    userId: string;
    derivAccountId: string;
    success: boolean;
    error?: string;
    mt5PositionId?: string;
    mt5ExecutionId?: string;
  }>;
  processedAt: Date;
}

/**
 * Phase 8 Execution Engine
 */
export class Phase8ExecutionEngine {
  
  /**
   * Process Phase 8 execution for a signal
   * Executes trades for all eligible demo accounts
   */
  async processSignalExecution(signalId: string): Promise<ExecutionSummary> {
    console.log(`PHASE8 | Processing signal execution | signalId=${signalId}`);
    
    const summary: ExecutionSummary = {
      signalId,
      totalEligibleAccounts: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      skippedExecutions: 0,
      executionResults: [],
      processedAt: new Date()
    };
    
    try {
      // Step 1: Find the signal
      const signal = await Signal.findById(signalId);
      if (!signal) {
        console.error(`PHASE8 | Signal not found | signalId=${signalId}`);
        return summary;
      }

      // Step 2: Get eligible demo accounts from Phase 6
      const eligibleAccounts = await UserEligibility.find({
        signalId,
        eligible: true,
        accountType: 'demo' // Only demo accounts
      }).populate('tradeParametersId');

      summary.totalEligibleAccounts = eligibleAccounts.length;
      console.log(`PHASE8 | Eligible demo accounts found | count=${eligibleAccounts.length}`);

      if (eligibleAccounts.length === 0) {
        console.log(`PHASE8 | No eligible demo accounts to process`);
        return summary;
      }

      // Step 3: Execute trades for each eligible account
      for (const eligibility of eligibleAccounts) {
        const userId = eligibility.userId.toString();
        const derivAccountId = eligibility.derivAccountId;
        
        console.log(`PHASE8 | Processing account | userId=${userId} | derivAccountId=${derivAccountId}`);

        try {
          // Step 3a: Get Phase 5 trade parameters
          const tradeParameters = await TradeParameters.findOne({
            signalId,
            userId,
            derivAccountId
          });

          if (!tradeParameters) {
            console.error(`PHASE8 | Trade parameters not found | userId=${userId} | derivAccountId=${derivAccountId}`);
            summary.executionResults.push({
              userId,
              derivAccountId,
              success: false,
              error: 'TRADE_PARAMETERS_NOT_FOUND'
            });
            summary.failedExecutions++;
            continue;
          }

          // Step 3b: Verify Phase 5 eligibility
          if (!tradeParameters.eligible) {
            console.log(`PHASE8 | Phase 5 marked user as ineligible | userId=${userId} | derivAccountId=${derivAccountId}`);
            summary.executionResults.push({
              userId,
              derivAccountId,
              success: false,
              error: 'PHASE5_NOT_ELIGIBLE'
            });
            summary.skippedExecutions++;
            continue;
          }

          // Step 3c: Verify position limit from Phase 5
          if (tradeParameters.positionLimitReached) {
            console.log(`PHASE8 | Position limit reached | userId=${userId} | derivAccountId=${derivAccountId}`);
            summary.executionResults.push({
              userId,
              derivAccountId,
              success: false,
              error: 'POSITION_LIMIT_REACHED'
            });
            summary.skippedExecutions++;
            continue;
          }

          // Step 3d: Build internal trade request
          const tradeRequest = MT5Adapter.buildTradeRequest(
            signal,
            tradeParameters,
            eligibility
          );

          // Step 3e: Execute trade via Phase 7 MT5 Adapter
          console.log(`PHASE8 | Executing trade via MT5 Adapter | userId=${userId} | derivAccountId=${derivAccountId}`);
          const executionResult = await mt5Adapter.executeTrade(tradeRequest);

          // Step 3f: Record execution result
          summary.executionResults.push({
            userId,
            derivAccountId,
            success: executionResult.success,
            error: executionResult.error,
            mt5PositionId: executionResult.mt5PositionId,
            mt5ExecutionId: executionResult.mt5ExecutionId
          });

          if (executionResult.success) {
            summary.successfulExecutions++;
            console.log(`PHASE8 | Trade executed successfully | userId=${userId} | derivAccountId=${derivAccountId} | mt5ExecutionId=${executionResult.mt5ExecutionId}`);
          } else {
            summary.failedExecutions++;
            console.log(`PHASE8 | Trade execution failed | userId=${userId} | derivAccountId=${derivAccountId} | error=${executionResult.error}`);
          }

        } catch (error) {
          console.error(`PHASE8 | Error processing account | userId=${userId} | derivAccountId=${derivAccountId}:`, error);
          summary.executionResults.push({
            userId,
            derivAccountId,
            success: false,
            error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
          });
          summary.failedExecutions++;
        }
      }

      console.log(`PHASE8 | Execution complete | total=${summary.totalEligibleAccounts} | success=${summary.successfulExecutions} | failed=${summary.failedExecutions} | skipped=${summary.skippedExecutions}`);
      
      return summary;

    } catch (error) {
      console.error(`PHASE8 | Error processing signal execution:`, error);
      throw error;
    }
  }

  /**
   * Process Phase 8 execution for multiple signals (batch processing)
   */
  async processBatchSignalExecution(signalIds: string[]): Promise<ExecutionSummary[]> {
    console.log(`PHASE8 | Processing batch signal execution | count=${signalIds.length}`);
    
    const summaries: ExecutionSummary[] = [];
    
    for (const signalId of signalIds) {
      try {
        const summary = await this.processSignalExecution(signalId);
        summaries.push(summary);
      } catch (error) {
        console.error(`PHASE8 | Error in batch processing for signal ${signalId}:`, error);
        // Continue with other signals even if one fails
      }
    }
    
    return summaries;
  }

  /**
   * Get execution statistics for a signal
   */
  async getExecutionStatistics(signalId: string): Promise<{
    totalEligible: number;
    successful: number;
    failed: number;
    pending: number;
  }> {
    const eligibleAccounts = await UserEligibility.countDocuments({
      signalId,
      eligible: true,
      accountType: 'demo'
    });

    const CopyTrade = (await import('@/models/CopyTrade')).default;
    
    const successful = await CopyTrade.countDocuments({
      signalId,
      status: 'OPEN',
      accountType: 'demo'
    });

    const failed = await CopyTrade.countDocuments({
      signalId,
      status: 'FAILED',
      accountType: 'demo'
    });

    const pending = await CopyTrade.countDocuments({
      signalId,
      status: 'PENDING',
      accountType: 'demo'
    });

    return {
      totalEligible: eligibleAccounts,
      successful,
      failed,
      pending
    };
  }
}

// Export singleton instance
export const phase8ExecutionEngine = new Phase8ExecutionEngine();

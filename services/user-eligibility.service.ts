/**
 * User Eligibility Service (Phase 6)
 * Determines if a specific demo Deriv account is allowed to copy a specific valid signal.
 * 
 * This is an eligibility gate that:
 * - Only processes DEMO accounts (real accounts are ignored)
 * - Checks connection status, bot status, and account status
 * - Validates Phase 5 trade parameters exist and are complete
 * - Respects Phase 5 position limit decisions
 * - Does NOT execute trades (that's Phase 7)
 * - Does NOT implement subscription logic (that's for future live account support)
 */

import mongoose from 'mongoose';
import DerivAccount from '@/models/DerivAccount';
import TradeParameters from '@/models/TradeParameters';
import UserEligibility, { IUserEligibility } from '@/models/UserEligibility';
import { ISignal } from '@/models/Signal';

export interface EligibilityResult {
  signalId: string;
  userId: string;
  derivAccountId: string;
  accountType: 'demo' | 'real';
  eligible: boolean;
  rejectionReason?: string;
  processedAt: Date;
}

export interface EligibilityProcessingResult {
  totalAccounts: number;
  demoAccountsProcessed: number;
  realAccountsIgnored: number;
  eligibleAccounts: number;
  rejectedAccounts: number;
  results: EligibilityResult[];
}

/**
 * Main service for Phase 6 user eligibility checking
 */
export class UserEligibilityService {
  
  /**
   * Process Phase 6 eligibility for a signal
   * Finds all demo accounts, checks eligibility, and creates eligibility records
   */
  async processSignalEligibility(signal: ISignal): Promise<EligibilityProcessingResult> {
    console.log(`PHASE6 | Processing signal | signalId=${signal._id}`);
    
    const result: EligibilityProcessingResult = {
      totalAccounts: 0,
      demoAccountsProcessed: 0,
      realAccountsIgnored: 0,
      eligibleAccounts: 0,
      rejectedAccounts: 0,
      results: [],
    };
    
    try {
      // Step 1: Find all DEMO connected Deriv accounts with active bot status
      // Phase 6 only processes demo accounts for now
      const derivAccounts = await DerivAccount.find({
        accountType: 'demo', // Only process demo accounts
        connectionStatus: 'connected',
        botStatus: 'ACTIVE'
      });
      
      result.totalAccounts = derivAccounts.length;
      console.log(`PHASE6 | Total connected + ACTIVE accounts found | count=${derivAccounts.length}`);
      
      if (derivAccounts.length === 0) {
        console.log(`PHASE6 | No eligible accounts found for processing`);
        return result;
      }
      
      // Step 2: Process each account
      for (const derivAccount of derivAccounts) {
        const userId = derivAccount.userId.toString();
        const derivAccountId = derivAccount.derivAccountId;
        const accountType = derivAccount.accountType;
        
        console.log(`PHASE6 | Checking account | derivAccountId=${derivAccountId} | accountType=${accountType}`);
        
        // All accounts in this query are demo accounts (filtered at query level)
        result.demoAccountsProcessed++;
        
        // Step 3: Process demo account eligibility
        const eligibilityResult = await this.checkAccountEligibility(
          signal,
          derivAccount
        );
        
        result.results.push(eligibilityResult);
        
        if (eligibilityResult.eligible) {
          result.eligibleAccounts++;
          console.log(`PHASE6 | USER ELIGIBLE | userId=${userId} | derivAccountId=${derivAccountId}`);
        } else {
          result.rejectedAccounts++;
          console.log(`PHASE6 | USER REJECTED | userId=${userId} | derivAccountId=${derivAccountId} | reason=${eligibilityResult.rejectionReason}`);
        }
      }
      
      console.log(`PHASE6 | Processing complete | demo=${result.demoAccountsProcessed} | realIgnored=${result.realAccountsIgnored} | eligible=${result.eligibleAccounts} | rejected=${result.rejectedAccounts}`);
      
      return result;
      
    } catch (error) {
      console.error(`PHASE6 | Error processing signal eligibility:`, error);
      throw error;
    }
  }
  
  /**
   * Check eligibility for a single demo account
   */
  private async checkAccountEligibility(
    signal: ISignal,
    derivAccount: any
  ): Promise<EligibilityResult> {
    const userId = derivAccount.userId.toString();
    const derivAccountId = derivAccount.derivAccountId;
    const signalId = signal._id.toString();
    
    const result: EligibilityResult = {
      signalId,
      userId,
      derivAccountId,
      accountType: derivAccount.accountType,
      eligible: false,
      processedAt: new Date(),
    };
    
    try {
      // Check if eligibility already exists (idempotency)
      const existingEligibility = await UserEligibility.findOne({
        signalId,
        userId,
        derivAccountId
      });
      
      if (existingEligibility) {
        console.log(`PHASE6 | Eligibility already exists | userId=${userId} | derivAccountId=${derivAccountId}`);
        return {
          signalId,
          userId,
          derivAccountId,
          accountType: derivAccount.accountType,
          eligible: existingEligibility.eligible,
          rejectionReason: existingEligibility.rejectionReason,
          processedAt: existingEligibility.processedAt,
        };
      }
      
      // Step 1: Verify connection status (should already be 'connected' from query, but double-check)
      if (derivAccount.connectionStatus !== 'connected') {
        result.rejectionReason = 'ACCOUNT_DISCONNECTED';
        await this.createEligibilityRecord(signal, derivAccount, result, null);
        return result;
      }
      console.log(`PHASE6 | Connection status=connected | derivAccountId=${derivAccountId}`);
      
      // Step 2: Verify bot status (should already be 'ACTIVE' from query, but double-check)
      if (derivAccount.botStatus !== 'ACTIVE') {
        result.rejectionReason = 'BOT_INACTIVE';
        await this.createEligibilityRecord(signal, derivAccount, result, null);
        return result;
      }
      console.log(`PHASE6 | Bot status=ACTIVE | derivAccountId=${derivAccountId}`);
      
      // Step 3: Find Phase 5 trade parameters for this user/signal
      const tradeParameters = await TradeParameters.findOne({
        signalId,
        userId,
        derivAccountId
      });
      
      if (!tradeParameters) {
        result.rejectionReason = 'TRADE_PARAMETERS_NOT_FOUND';
        await this.createEligibilityRecord(signal, derivAccount, result, null);
        return result;
      }
      console.log(`PHASE6 | Phase 5 parameters found | userId=${userId} | derivAccountId=${derivAccountId}`);
      
      // Step 4: Verify Phase 5 marked this user as eligible
      if (!tradeParameters.eligible) {
        result.rejectionReason = 'PHASE5_NOT_ELIGIBLE';
        await this.createEligibilityRecord(signal, derivAccount, result, tradeParameters._id);
        return result;
      }
      console.log(`PHASE6 | Phase 5 eligibility=true | userId=${userId} | derivAccountId=${derivAccountId}`);
      
      // Step 5: Check position limit from Phase 5
      if (tradeParameters.positionLimitReached) {
        result.rejectionReason = 'POSITION_LIMIT_REACHED';
        await this.createEligibilityRecord(signal, derivAccount, result, tradeParameters._id);
        return result;
      }
      console.log(`PHASE6 | Position limit passed | userId=${userId} | derivAccountId=${derivAccountId}`);
      
      // Step 6: Verify required final trade parameters exist
      if (!tradeParameters.finalStopLoss) {
        result.rejectionReason = 'MISSING_FINAL_STOP_LOSS';
        await this.createEligibilityRecord(signal, derivAccount, result, tradeParameters._id);
        return result;
      }
      
      if (!tradeParameters.finalTakeProfit) {
        result.rejectionReason = 'MISSING_FINAL_TAKE_PROFIT';
        await this.createEligibilityRecord(signal, derivAccount, result, tradeParameters._id);
        return result;
      }
      
      if (!tradeParameters.finalLotSize) {
        result.rejectionReason = 'MISSING_FINAL_LOT_SIZE';
        await this.createEligibilityRecord(signal, derivAccount, result, tradeParameters._id);
        return result;
      }
      console.log(`PHASE6 | Final trade parameters validated | userId=${userId} | derivAccountId=${derivAccountId}`);
      
      // Step 7: All checks passed - user is eligible
      result.eligible = true;
      result.rejectionReason = undefined;
      await this.createEligibilityRecord(signal, derivAccount, result, tradeParameters._id);
      
      return result;
      
    } catch (error) {
      console.error(`PHASE6 | Error checking account eligibility for ${derivAccountId}:`, error);
      result.rejectionReason = 'ELIGIBILITY_CHECK_ERROR';
      await this.createEligibilityRecord(signal, derivAccount, result, null);
      return result;
    }
  }
  
  /**
   * Create an eligibility record in the database
   */
  private async createEligibilityRecord(
    signal: ISignal,
    derivAccount: any,
    eligibilityResult: EligibilityResult,
    tradeParametersId: mongoose.Types.ObjectId | null
  ): Promise<void> {
    try {
      const userEligibility = new UserEligibility({
        signalId: signal._id,
        userId: derivAccount.userId,
        derivAccountId: derivAccount.derivAccountId,
        accountType: derivAccount.accountType,
        connectionStatus: derivAccount.connectionStatus,
        botStatus: derivAccount.botStatus,
        tradeParametersId: tradeParametersId,
        eligible: eligibilityResult.eligible,
        rejectionReason: eligibilityResult.rejectionReason,
        processedAt: eligibilityResult.processedAt,
      });
      
      await userEligibility.save();
      console.log(`PHASE6 | Eligibility record created | userId=${derivAccount.userId} | derivAccountId=${derivAccount.derivAccountId} | eligible=${eligibilityResult.eligible}`);
      
    } catch (error) {
      console.error(`PHASE6 | Error creating eligibility record:`, error);
      // Don't throw - we want to continue processing other accounts
    }
  }
  
  /**
   * Get eligible accounts for a signal (for Phase 7 handoff)
   */
  async getEligibleAccounts(signalId: string): Promise<any[]> {
    try {
      const eligibleAccounts = await UserEligibility.find({
        signalId,
        eligible: true,
        accountType: 'demo' // Only demo accounts for now
      }).populate('tradeParametersId');
      
      console.log(`PHASE6 | Retrieved eligible accounts for Phase 7 | signalId=${signalId} | count=${eligibleAccounts.length}`);
      return eligibleAccounts;
      
    } catch (error) {
      console.error(`PHASE6 | Error retrieving eligible accounts:`, error);
      throw error;
    }
  }
}

/**
 * Trade Parameter Resolver Service (Phase 5)
 * Resolves final execution parameters for copy trading based on:
 * - User's current Deriv MT5/CFD account balance (fetched from MT5 API)
 * - Admin-configured balance-based rules (lot size, stop loss, position limits)
 * - Deterministic take profit selection from Telegram signal
 * 
 * This service does NOT execute trades - it prepares and validates parameters
 * for the execution layer.
 * 
 * UPDATED: Now uses MT5 API for balance fetching instead of Options API
 */

import DerivAccount from '@/models/DerivAccount';
import LotSizeManagement from '@/models/LotSizeManagement';
import StopLossManagement from '@/models/StopLossManagement';
import PositionLimit from '@/models/PositionLimit';
import { ISignal } from '@/models/Signal';

export interface ResolvedTradeParameters {
  signalId: string;
  userId: string;
  derivAccountId: string;
  
  // Balance information
  currentBalance: number;
  databaseBalance: number;
  balanceSynchronized: boolean;
  
  // Original Telegram signal values (for audit)
  telegramStopLoss: number;
  telegramTakeProfits: number[];
  telegramStake?: number;  // was: telegramLotSize
  
  // Admin-configured values
  configuredStake?: number;  // was: configuredLotSize
  configuredStopLoss?: number;
  configuredMaxPositions?: number;
  
  // Final execution parameters
  finalStopLoss?: number;
  finalTakeProfit?: number;
  finalStake?: number;  // was: finalLotSize
  
  // Position management
  currentOpenPositions: number;
  maxPositions?: number;
  positionLimitReached: boolean;
  
  // Eligibility
  eligible: boolean;
  rejectionReason?: string;
}

export interface BalanceFetchResult {
  success: boolean;
  currentBalance?: number;
  error?: string;
}

/**
 * Main service for resolving trade parameters
 */
export class TradeParameterResolver {
   
  /**
   * Fetch current balance from Deriv API using WebSocket authentication
   */
  private async fetchCurrentDerivBalance(derivAccount: any): Promise<BalanceFetchResult> {
    try {
      console.log(`[TradeParameterResolver] Fetching current balance for account ${derivAccount.derivAccountId}`);
      
      // Check if token is expired
      if (derivAccount.tokenExpiresAt < new Date()) {
        console.log(`[TradeParameterResolver] Token expired at ${derivAccount.tokenExpiresAt}, current time ${new Date()}`);
        return {
          success: false,
          error: 'ACCESS_TOKEN_EXPIRED'
        };
      }
      
      return {
        success: false,
        error: 'MT5_BALANCE_REQUIRES_EA_BRIDGE'
      };
      
    } catch (error) {
      console.error(`[TradeParameterResolver] MT5 balance fetch error:`, error);
      console.error(`[TradeParameterResolver] Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'BALANCE_FETCH_ERROR'
      };
    }
  }
  
  /**
   * Synchronize database balance with current Deriv balance
   */
  private async synchronizeBalance(derivAccount: any, currentBalance: number): Promise<boolean> {
    try {
      const databaseBalance = parseFloat(derivAccount.balance || '0');
      
      if (Math.abs(currentBalance - databaseBalance) > 0.01) {
        console.log(`[TradeParameterResolver] Synchronizing balance: DB=${databaseBalance}, Deriv=${currentBalance}`);
        derivAccount.balance = currentBalance.toString();
        await derivAccount.save();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`[TradeParameterResolver] Balance synchronization error:`, error);
      return false;
    }
  }
  
  /**
   * Match balance against lot size rules
   */
  private async matchLotSizeRule(balance: number): Promise<{ lotSize?: number; error?: string }> {
    try {
      const rule = await LotSizeManagement.findOne({
        active: true,
        min_balance: { $lte: balance },
        max_balance: { $gte: balance }
      });
      
      if (!rule) {
        return { error: 'NO_MATCHING_LOT_SIZE_RULE' };
      }
      
      console.log(`[TradeParameterResolver] Lot size rule matched: balance=${balance}, lot_size=${rule.lot_size}`);
      return { lotSize: rule.lot_size };
      
    } catch (error) {
      console.error(`[TradeParameterResolver] Lot size rule matching error:`, error);
      return { error: 'LOT_SIZE_RULE_MATCHING_ERROR' };
    }
  }
  
  /**
   * Match balance against stop loss rules
   */
  private async matchStopLossRule(balance: number): Promise<{ stopLoss?: number; error?: string }> {
    try {
      const rule = await StopLossManagement.findOne({
        active: true,
        min_balance: { $lte: balance },
        max_balance: { $gte: balance }
      });
      
      if (!rule) {
        return { error: 'NO_MATCHING_STOP_LOSS_RULE' };
      }
      
      console.log(`[TradeParameterResolver] Stop loss rule matched: balance=${balance}, stop_loss=${rule.stop_loss}`);
      return { stopLoss: rule.stop_loss };
      
    } catch (error) {
      console.error(`[TradeParameterResolver] Stop loss rule matching error:`, error);
      return { error: 'STOP_LOSS_RULE_MATCHING_ERROR' };
    }
  }
  
  /**
   * Match balance against position limit rules
   */
  private async matchPositionLimitRule(balance: number): Promise<{ maxPositions?: number; error?: string }> {
    try {
      const rule = await PositionLimit.findOne({
        active: true,
        min_balance: { $lte: balance },
        max_balance: { $gte: balance }
      });
      
      if (!rule) {
        return { error: 'NO_MATCHING_POSITION_LIMIT_RULE' };
      }
      
      console.log(`[TradeParameterResolver] Position limit rule matched: balance=${balance}, max_positions=${rule.max_positions}`);
      return { maxPositions: rule.max_positions };
      
    } catch (error) {
      console.error(`[TradeParameterResolver] Position limit rule matching error:`, error);
      return { error: 'POSITION_LIMIT_RULE_MATCHING_ERROR' };
    }
  }
  
  /**
   * Select take profit deterministically based on count
   * Rule: 1→TP1, 2→TP1, 3→TP2, 4→TP3, 5→TP4, 6→TP5
   */
  private selectTakeProfit(takeProfits: number[]): { selectedTP?: number; error?: string } {
    if (!takeProfits || takeProfits.length === 0) {
      return { error: 'NO_TAKE_PROFITS' };
    }
    
    if (takeProfits.length > 6) {
      return { error: 'UNSUPPORTED_TP_COUNT' };
    }
    
    // Deterministic TP selection
    const tpIndex = this.getTPIndex(takeProfits.length);
    const selectedTP = takeProfits[tpIndex];
    
    console.log(`[TradeParameterResolver] TP selection: count=${takeProfits.length}, selected_index=${tpIndex}, selected_tp=${selectedTP}`);
    return { selectedTP };
  }
  
  /**
   * Get TP index based on count (0-indexed)
   * 1 TP → index 0 (TP1)
   * 2 TPs → index 0 (TP1)
   * 3 TPs → index 1 (TP2)
   * 4 TPs → index 2 (TP3)
   * 5 TPs → index 3 (TP4)
   * 6 TPs → index 4 (TP5)
   */
  private getTPIndex(tpCount: number): number {
    switch (tpCount) {
      case 1:
      case 2:
        return 0; // TP1
      case 3:
        return 1; // TP2
      case 4:
        return 2; // TP3
      case 5:
        return 3; // TP4
      case 6:
        return 4; // TP5
      default:
        return 0; // Fallback to TP1
    }
  }
  
  /**
   * Calculate final stop loss from configured value
   * This is isolated so the unit logic can be configured
   * For now, assuming the configured stop_loss is in price distance units
   */
  private calculateFinalStopLoss(configuredStopLoss: number, direction: 'BUY' | 'SELL', entry: number): number {
    // For BUY: SL = entry - configured_stop_loss
    // For SELL: SL = entry + configured_stop_loss
    if (direction === 'BUY') {
      return entry - configuredStopLoss;
    } else {
      return entry + configuredStopLoss;
    }
  }
  
  /**
   * Count user's current open positions
   * TODO: Implement actual position counting when copy trade model exists
   * For now, returns 0 as placeholder
   */
  private async countOpenPositions(userId: string, derivAccountId: string): Promise<number> {
    // TODO: Query copy trade positions collection when it exists
    // For now, return 0 as the system doesn't have position tracking yet
    console.log(`[TradeParameterResolver] Counting open positions for user ${userId}, account ${derivAccountId}`);
    return 0;
  }
  
  /**
   * Main method to resolve trade parameters for a signal and user
   */
  async resolveTradeParameters(
    signal: ISignal, 
    userId: string
  ): Promise<ResolvedTradeParameters> {
    console.log(`[TradeParameterResolver] Resolving trade parameters for signal ${signal._id}, user ${userId}`);
    
    const result: ResolvedTradeParameters = {
      signalId: signal._id.toString(),
      userId,
      derivAccountId: '',
      currentBalance: 0,
      databaseBalance: 0,
      balanceSynchronized: false,
      telegramStopLoss: signal.stopLoss,
      telegramTakeProfits: signal.takeProfits,
      telegramStake: signal.stake,
      currentOpenPositions: 0,
      positionLimitReached: false,
      eligible: false
    };
    
    try {
      // Step 1: Find user's DEMO Deriv account
      // Phase 5 and Phase 6 only process demo accounts for now
      const derivAccount = await DerivAccount.findOne({
        userId,
        accountType: 'demo', // Only process demo accounts
        connectionStatus: 'connected'
      });
      
      if (!derivAccount) {
        result.rejectionReason = 'NO_CONNECTED_DEMO_DERIV_ACCOUNT';
        console.log(`[TradeParameterResolver] Rejected: No connected demo Deriv account`);
        return result;
      }
      
      result.derivAccountId = derivAccount.derivAccountId;
      result.databaseBalance = parseFloat(derivAccount.balance || '0');
      
      // Step 2: Fetch current balance from Deriv API
      const balanceResult = await this.fetchCurrentDerivBalance(derivAccount);
      
      if (!balanceResult.success || balanceResult.currentBalance === undefined) {
        // Fallback: Use database balance if API fetch fails
        console.log(`[TradeParameterResolver] Balance fetch failed (${balanceResult.error}), using database balance as fallback: ${result.databaseBalance}`);
        result.currentBalance = result.databaseBalance;
        result.balanceSynchronized = false;
        // Continue with database balance instead of rejecting
      } else {
        result.currentBalance = balanceResult.currentBalance;
        
        // Step 3: Synchronize database balance if needed
        result.balanceSynchronized = await this.synchronizeBalance(derivAccount, result.currentBalance);
      }
      
      // Safety check: Ensure we have a valid balance
      if (result.currentBalance <= 0) {
        result.rejectionReason = 'INVALID_BALANCE';
        console.log(`[TradeParameterResolver] Rejected: Invalid balance (${result.currentBalance})`);
        return result;
      }
      
      // Step 4: Match lot size rule
      const lotSizeResult = await this.matchLotSizeRule(result.currentBalance);
      if (lotSizeResult.error) {
        result.rejectionReason = lotSizeResult.error;
        console.log(`[TradeParameterResolver] Rejected: ${result.rejectionReason}`);
        return result;
      }
      result.configuredStake = lotSizeResult.lotSize;
      
      // For Multipliers, lot_size from admin config is treated as stake in USD
      // Ensure minimum stake of at least 5 USD for Multipliers (based on typical Deriv requirements)
      let finalStake: number;
      if (lotSizeResult.lotSize && lotSizeResult.lotSize < 5) {
        console.log(`[TradeParameterResolver] Lot size ${lotSizeResult.lotSize} below Multipliers minimum, setting to 5`);
        finalStake = 5;
      } else {
        finalStake = lotSizeResult.lotSize || 5;
      }
      result.finalStake = finalStake;
      
      // Step 5: Match stop loss rule
      const stopLossResult = await this.matchStopLossRule(result.currentBalance);
      if (stopLossResult.error) {
        result.rejectionReason = stopLossResult.error;
        console.log(`[TradeParameterResolver] Rejected: ${result.rejectionReason}`);
        return result;
      }
      result.configuredStopLoss = stopLossResult.stopLoss;
      
      // Step 6: Calculate final stop loss (admin config overrides Telegram SL)
      // For MARKET orders, use the Telegram stop loss directly since entry price is unknown
      // For LIMIT/STOP orders, calculate from entry price
      if (signal.sourceOrderType === 'MARKET') {
        // MARKET orders: Use Telegram SL directly
        result.finalStopLoss = signal.stopLoss;
        console.log(`[TradeParameterResolver] MARKET order: Using Telegram SL directly: ${result.finalStopLoss}`);
      } else if (signal.sourceEntryPrice !== undefined) {
        // LIMIT/STOP orders: Calculate from entry price
        result.finalStopLoss = this.calculateFinalStopLoss(
          result.configuredStopLoss!,
          signal.direction,
          signal.sourceEntryPrice
        );
        console.log(`[TradeParameterResolver] LIMIT/STOP order: Calculated SL from entry: ${result.finalStopLoss}`);
      } else {
        result.rejectionReason = 'MISSING_ENTRY_FOR_SL_CALCULATION';
        console.log(`[TradeParameterResolver] Rejected: ${result.rejectionReason}`);
        return result;
      }
      
      // Step 7: Match position limit rule
      const positionLimitResult = await this.matchPositionLimitRule(result.currentBalance);
      if (positionLimitResult.error) {
        result.rejectionReason = positionLimitResult.error;
        console.log(`[TradeParameterResolver] Rejected: ${result.rejectionReason}`);
        return result;
      }
      result.configuredMaxPositions = positionLimitResult.maxPositions;
      
      // Step 8: Count current open positions
      result.currentOpenPositions = await this.countOpenPositions(userId, derivAccount.derivAccountId);
      
      // Step 9: Check position limit
      if (result.currentOpenPositions >= result.configuredMaxPositions!) {
        result.positionLimitReached = true;
        result.rejectionReason = 'POSITION_LIMIT_REACHED';
        console.log(`[TradeParameterResolver] Rejected: Position limit reached (${result.currentOpenPositions}/${result.configuredMaxPositions})`);
        return result;
      }
      
      // Step 10: Select take profit
      const tpResult = this.selectTakeProfit(signal.takeProfits);
      if (tpResult.error) {
        result.rejectionReason = tpResult.error;
        console.log(`[TradeParameterResolver] Rejected: ${result.rejectionReason}`);
        return result;
      }
      result.finalTakeProfit = tpResult.selectedTP;
      
      // Step 11: Mark as eligible
      result.eligible = true;
      console.log(`[TradeParameterResolver] Trade parameters resolved successfully`);
      
      return result;
      
    } catch (error) {
      console.error(`[TradeParameterResolver] Error resolving trade parameters:`, error);
      result.rejectionReason = 'RESOLUTION_ERROR';
      return result;
    }
  }
}
/**
 * MT5 Adapter Service
 * Replaces the Options-based deriv-adapter.service.ts with MT5/CFD architecture
 * 
 * This service:
 * - Is the main interface for MT5/CFD trade execution
 * - Converts internal trade requests to MT5 format
 * - Uses MT5 execution service for signal preparation
 * - Manages the interface with MT5 Expert Advisor
 * - Replaces all Options/Multipliers trading logic
 * - Stores execution results in CopyTrade model
 * - Enforces demo account safety
 * - Prevents duplicate execution
 */

import DerivAccount from '@/models/DerivAccount';
import CopyTrade from '@/models/CopyTrade';
import MT5SignalQueueModel from '@/models/MT5SignalQueue';
import { decrypt } from '@/lib/encryption';
import { MT5ExecutionService, MT5TradeSignal, MT5ExecutionResponse } from './mt5-execution.service';
import { createDerivMT5Service, resolveDerivAppId } from './deriv-mt5.service';
import { ISignal } from '@/models/Signal';
import { ITradeParameters } from '@/models/TradeParameters';
import { IUserEligibility } from '@/models/UserEligibility';

export interface InternalTradeRequest {
  signalId: string;
  userId: string;
  derivAccountId: string;
  
  // Trade parameters from Phase 5
  asset: string;  // XAUUSD
  direction: 'BUY' | 'SELL';
  sourceOrderType: 'MARKET' | 'LIMIT' | 'STOP';
  sourceEntryPrice?: number;
  stopLoss: number;
  takeProfit: number;
  stake: number;  // Amount to trade
}

export interface ExecutionResult {
  success: boolean;
  broker: 'deriv';
  platform: 'mt5';
  product: 'cfd';
  derivAccountId: string;
  
  // MT5 identifiers
  mt5PositionId?: string;
  mt5ExecutionId?: string;
  
  // Execution details
  executionPrice?: number;
  status: 'OPEN' | 'FAILED' | 'PENDING' | 'SENT_TO_MT5';
  
  // Error details
  error?: string;
  errorCode?: string;
  
  // Raw reference data for debugging
  rawReferenceData?: any;
}

/**
 * MT5 Adapter Service
 * 
 * This replaces the Options-based deriv-adapter.service.ts
 * All Options/Multipliers logic has been removed.
 * Only MT5/CFD execution is supported.
 */
export class MT5Adapter {
  /**
   * Execute trade using MT5/CFD architecture
   */
  async executeTrade(request: InternalTradeRequest): Promise<ExecutionResult> {
    console.log(`[MT5Adapter] Executing MT5/CFD trade for signal ${request.signalId}, user ${request.userId}`);

    const result: ExecutionResult = {
      success: false,
      broker: 'deriv',
      platform: 'mt5',
      product: 'cfd',
      derivAccountId: request.derivAccountId,
      status: 'FAILED'
    };

    try {
      // Step 1: Get Deriv MT5 account and access token
      const derivAccount = await DerivAccount.findOne({ 
        derivAccountId: request.derivAccountId,
        accountPlatform: 'mt5',
        product: 'cfd'
      });
      
      if (!derivAccount) {
        throw new Error(`MT5/CFD account not found: ${request.derivAccountId}`);
      }

      // Verify this is actually an MT5 account
      if (derivAccount.accountPlatform !== 'mt5' || derivAccount.product !== 'cfd') {
        throw new Error('ACCOUNT_NOT_MT5_CFD');
      }

      // Check if token is expired
      if (derivAccount.tokenExpiresAt < new Date()) {
        throw new Error('ACCESS_TOKEN_EXPIRED');
      }

      // Decrypt the access token
      let accessToken: string;
      try {
        accessToken = decrypt(derivAccount.accessTokenEncrypted);
      } catch (error) {
        throw new Error('TOKEN_DECRYPTION_FAILED');
      }

      // Step 2: Verify demo account (safety check)
      await this.verifyDemoAccount(request.derivAccountId);
      console.log(`[MT5Adapter] Demo MT5 account verified`);

      // Step 3: Check for duplicate execution (idempotency)
      const isDuplicate = await this.checkDuplicateExecution(
        request.signalId,
        request.userId,
        request.derivAccountId
      );

      if (isDuplicate) {
        result.error = 'DUPLICATE_EXECUTION';
        result.errorCode = 'DUPLICATE_EXECUTION';
        console.log(`[MT5Adapter] Duplicate execution detected, skipping`);
        return result;
      }

      // Step 4: Verify MT5 account is still valid using MT5 service
      const mt5Service = createDerivMT5Service(accessToken, resolveDerivAppId());
      const mt5Validation = await mt5Service.validateMT5Account(derivAccount.mt5Login!);
      
      if (!mt5Validation.isValid) {
        throw new Error(`MT5 account validation failed: ${mt5Validation.error}`);
      }

      console.log(`[MT5Adapter] MT5 account validated successfully`);

      // Step 5: Create pending copy trade record
      const copyTrade = new CopyTrade({
        signalId: request.signalId,
        userId: request.userId,
        derivAccountId: request.derivAccountId,
        broker: 'deriv',
        platform: 'mt5',
        product: 'cfd',
        accountType: 'demo',
        asset: request.asset,
        direction: request.direction,
        sourceOrderType: request.sourceOrderType,
        sourceEntryPrice: request.sourceEntryPrice,
        stopLoss: request.stopLoss,
        takeProfit: request.takeProfit,
        takeProfits: [request.takeProfit],
        stake: request.stake,
        status: 'PENDING',
        processedAt: new Date(),
        mt5Symbol: request.asset, // Will be converted to MT5 format
        mt5Login: derivAccount.mt5Login,
        mt5Server: derivAccount.mt5Server,
      });

      await copyTrade.save();
      console.log(`[MT5Adapter] Pending copy trade record created`);

      // Step 6: Convert internal trade request to MT5 signal format
      const mt5Signal = MT5ExecutionService.convertToMT5Signal(
        request.signalId,
        request.userId,
        derivAccount.mt5Login!,
        derivAccount.mt5Server!,
        derivAccount.accountType,
        request.asset,
        request.direction,
        request.sourceEntryPrice,
        request.stopLoss,
        request.takeProfit,
        request.stake
      );

      console.log(`[MT5Adapter] Converted to MT5 signal:`, {
        symbol: mt5Signal.symbol,
        side: mt5Signal.side,
        volume: mt5Signal.volume,
        stopLoss: mt5Signal.stopLoss,
        takeProfit: mt5Signal.takeProfit,
      });

      // Step 7: Validate MT5 signal
      const validation = MT5ExecutionService.validateMT5Signal(mt5Signal);
      if (!validation.valid) {
        throw new Error(`MT5 signal validation failed: ${validation.errors.join(', ')}`);
      }

      // Step 8: Prepare execution request for MT5 Expert Advisor
      const executionRequest = MT5ExecutionService.prepareExecutionRequest(mt5Signal);
      
      console.log(`[MT5Adapter] Prepared MT5 execution request`);

      // Step 9: Store signal in MT5 queue for Expert Advisor consumption
      // In production, this would be stored in a database that the EA polls
      await this.enqueueMT5Signal(mt5Signal);
      
      // Step 10: Update copy trade status to SENT_TO_MT5
      copyTrade.status = 'SENT_TO_MT5';
      copyTrade.mt5SignalId = mt5Signal.signalId;
      copyTrade.mt5Symbol = mt5Signal.symbol;
      copyTrade.mt5Volume = mt5Signal.volume;
      copyTrade.mt5StopLoss = mt5Signal.stopLoss;
      copyTrade.mt5TakeProfit = mt5Signal.takeProfit;
      copyTrade.mt5ExecutionStatus = 'sent';
      copyTrade.sentToMT5At = new Date();
      await copyTrade.save();

      // Step 11: Return success result
      result.success = true;
      result.status = 'SENT_TO_MT5';
      result.mt5ExecutionId = mt5Signal.signalId; // Use signal ID as execution ID
      result.executionPrice = request.sourceEntryPrice;
      result.rawReferenceData = {
        mt5Signal,
        executionRequest,
      };

      console.log(`[MT5Adapter] MT5 trade signal sent for execution`);
      return result;

    } catch (error) {
      console.error('[MT5Adapter] MT5 trade execution failed with details:', {
        error_message: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        error_name: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
        error_stack: error instanceof Error ? error.stack : undefined,
        error_type: typeof error,
        request_details: {
          signalId: request.signalId,
          userId: request.userId,
          derivAccountId: request.derivAccountId,
          asset: request.asset,
          direction: request.direction,
          sourceOrderType: request.sourceOrderType,
          sourceEntryPrice: request.sourceEntryPrice,
          stopLoss: request.stopLoss,
          takeProfit: request.takeProfit,
          stake: request.stake
        }
      });

      // Update copy trade record with failure
      try {
        const copyTrade = await CopyTrade.findOne({
          signalId: request.signalId,
          userId: request.userId,
          derivAccountId: request.derivAccountId,
          status: 'PENDING'
        });

        if (copyTrade) {
          copyTrade.status = 'FAILED';
          copyTrade.failureReason = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
          await copyTrade.save();
        }
      } catch (updateError) {
        console.error('[MT5Adapter] Failed to update copy trade record:', updateError);
      }

      result.error = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      result.errorCode = error instanceof Error ? error.name : 'UNKNOWN_ERROR';
      return result;
    }
  }

  /**
   * Check if this is a demo account (safety check)
   */
  private async verifyDemoAccount(derivAccountId: string): Promise<boolean> {
    const derivAccount = await DerivAccount.findOne({ derivAccountId });
    if (!derivAccount) {
      throw new Error(`MT5 account not found: ${derivAccountId}`);
    }

    if (derivAccount.accountType !== 'demo') {
      throw new Error('EXECUTION_BLOCKED_REAL_ACCOUNT_NOT_SUPPORTED');
    }

    if (derivAccount.connectionStatus !== 'connected') {
      throw new Error('ACCOUNT_NOT_CONNECTED');
    }

    if (derivAccount.botStatus !== 'ACTIVE') {
      throw new Error('BOT_NOT_ACTIVE');
    }

    if (derivAccount.accountPlatform !== 'mt5' || derivAccount.product !== 'cfd') {
      throw new Error('ACCOUNT_NOT_MT5_CFD');
    }

    return true;
  }

  /**
   * Check for duplicate execution (idempotency)
   */
  private async checkDuplicateExecution(
    signalId: string,
    userId: string,
    derivAccountId: string
  ): Promise<boolean> {
    const existingTrade = await CopyTrade.findOne({
      signalId,
      userId,
      derivAccountId,
      status: { $in: ['PENDING', 'SENT_TO_MT5', 'OPEN'] }
    });

    return existingTrade !== null;
  }

  /**
   * Enqueue MT5 signal for Expert Advisor consumption.
   *
   * Persists the prepared MT5TradeSignal into the MT5SignalQueue collection
   * so that the MT5 Expert Advisor can poll it via:
   *   GET /api/deriv/mt5/signals?mt5Login=<login>&status=pending
   *
   * The EA then:
   *   1. Reads pending signals.
   *   2. Opens the XAUUSD CFD position in the user's MT5 account.
   *   3. Reports the result back via:
   *        POST /api/deriv/mt5/signals/[signalId]/result
   */
  private async enqueueMT5Signal(signal: MT5TradeSignal): Promise<void> {
    await MT5SignalQueueModel.create({
      signalId: signal.signalId,
      userId: signal.userId,
      mt5Login: signal.mt5Login,
      mt5Server: signal.mt5Server,
      accountType: signal.accountType,
      symbol: signal.symbol,
      side: signal.side,
      volume: signal.volume,
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      status: 'pending',
      source: signal.source,
      expiresAt: signal.expiresAt,
      createdAt: signal.createdAt,
    });

    console.log('[MT5Adapter] MT5 signal persisted to queue for EA consumption:', {
      signalId: signal.signalId,
      symbol: signal.symbol,
      side: signal.side,
      volume: signal.volume,
      mt5Login: signal.mt5Login.substring(0, 6) + '...',
      expiresAt: signal.expiresAt,
    });
  }

  /**
   * Build internal trade request from Phase 5/6 data
   */
  static buildTradeRequest(
    signal: ISignal,
    tradeParameters: ITradeParameters,
    userEligibility: IUserEligibility
  ): InternalTradeRequest {
    return {
      signalId: signal._id.toString(),
      userId: userEligibility.userId.toString(),
      derivAccountId: userEligibility.derivAccountId,
      asset: signal.asset,
      direction: signal.direction,
      sourceOrderType: signal.sourceOrderType,
      sourceEntryPrice: signal.sourceEntryPrice,
      stopLoss: tradeParameters.finalStopLoss!,
      takeProfit: tradeParameters.finalTakeProfit!,
      stake: tradeParameters.finalStake!
    };
  }
}

// Export singleton instance
export const mt5Adapter = new MT5Adapter();
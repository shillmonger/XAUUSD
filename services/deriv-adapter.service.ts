/**
 * Deriv Adapter Service (Phase 7)
 * Translates internal trade format to Deriv-specific API calls and executes trades
 * 
 * This service:
 * - Isolates Deriv-specific logic from the rest of the application
 * - Translates internal trade format to Deriv API format
 * - Executes proposal → buy workflow for Deriv Multipliers
 * - Uses MULTUP/MULTDOWN contract types for Multipliers
 * - SL/TP mechanism is currently unclear from Deriv documentation
 * - contract_update is disabled (not supported for Multipliers)
 * - Returns normalized execution results
 * - Stores execution results in CopyTrade model
 * - Enforces demo account safety
 * - Prevents duplicate execution
 * - Reuses existing encrypted token authentication
 */

import DerivAccount from '@/models/DerivAccount';
import CopyTrade from '@/models/CopyTrade';
import { decrypt } from '@/lib/encryption';
import { createDerivApiClient, DerivApiClient } from './deriv-api-client.service';
import { derivSymbolMapper, SymbolMapping } from './deriv-symbol-mapper.service';
import { ISignal } from '@/models/Signal';
import { ITradeParameters } from '@/models/TradeParameters';
import { IUserEligibility } from '@/models/UserEligibility';

export interface InternalTradeRequest {
  signalId: string;
  userId: string;
  derivAccountId: string;
  
  // Trade parameters from Phase 5
  asset: string;  // was: symbol
  direction: 'BUY' | 'SELL';
  sourceOrderType: 'MARKET' | 'LIMIT' | 'STOP';  // was: orderType
  sourceEntryPrice?: number;  // was: entry
  stopLoss: number;
  takeProfit: number;
  stake: number;  // was: lotSize
}

export interface ExecutionResult {
  success: boolean;
  broker: 'deriv';
  derivAccountId: string;
  
  // Broker identifiers
  brokerContractId?: string;
  brokerTransactionId?: string;
  
  // Execution details
  executionPrice?: number;
  status: 'OPEN' | 'FAILED' | 'PENDING';
  
  // Error details
  error?: string;
  errorCode?: string;
  
  // Raw reference data for debugging
  rawReferenceData?: any;
}

/**
 * Deriv Adapter Service
 */
export class DerivAdapter {
  private apiClient: DerivApiClient | null = null;
  private symbolMappingCache: Map<string, SymbolMapping> = new Map();

  /**
   * Get Deriv underlying symbol for internal asset using the symbol mapper
   */
  private async getDerivSymbol(internalAsset: string, derivAccountId: string, accessToken: string, accountType: 'demo' | 'real'): Promise<string> {
    console.log(`[DerivAdapter] Getting Deriv symbol for: ${internalAsset}`);
    
    // Check cache first
    const cached = this.symbolMappingCache.get(internalAsset);
    if (cached) {
      console.log(`[DerivAdapter] Using cached symbol mapping: ${internalAsset} -> ${cached.derivSymbol}`);
      return cached.derivSymbol;
    }

    // Discover symbol mapping using the symbol mapper
    console.log(`[DerivAdapter] Discovering symbol mapping via symbol mapper`);
    const discoveryResult = await derivSymbolMapper.discoverSymbolMapping(internalAsset, derivAccountId, accessToken, accountType);
    
    if (!discoveryResult.success) {
      console.error(`[DerivAdapter] Symbol mapping discovery failed: ${discoveryResult.error}`);
      console.log(`[DerivAdapter] Attempting fallback symbol mapping`);
      // Use fallback symbol as safety net
      return this.getFallbackSymbol(internalAsset);
    }
    
    // Cache the mapping
    this.symbolMappingCache.set(internalAsset, discoveryResult.details!);
    
    console.log(`[DerivAdapter] Symbol mapping discovered: ${internalAsset} -> ${discoveryResult.derivSymbol}`);
    return discoveryResult.derivSymbol!;
  }

  /**
   * Translate internal direction to Deriv contract type for Multipliers
   * Multipliers use MULTUP for BUY and MULTDOWN for SELL
   */
  private translateDirection(direction: 'BUY' | 'SELL'): string {
    // For Deriv Multipliers:
    // BUY -> MULTUP (Up direction)
    // SELL -> MULTDOWN (Down direction)
    return direction === 'BUY' ? 'MULTUP' : 'MULTDOWN';
  }

  /**
   * Translate internal stake to Deriv stake/amount
   * Deriv uses "stake" or "payout" as the basis for contract size
   * This is a simplified translation - may need adjustment based on the product
   */
  private translateStake(stake: number): number {
    // For now, we assume stake maps directly
    // This may need to be adjusted based on the specific Deriv product
    return stake;
  }

  /**
   * Fallback symbol mapping if discovery fails
   * This provides a hardcoded fallback for common symbols as a safety net
   * Based on Deriv support: Standard Gold/USD symbol: XAUUSD, Gold/USD Micro symbol: XAUUSDmicro
   */
  private getFallbackSymbol(internalAsset: string): string {
    console.log(`[DerivAdapter] Using fallback symbol mapping for: ${internalAsset}`);
    
    // Common fallback mappings based on Deriv support information
    const fallbackMap: Record<string, string> = {
      'XAUUSD': 'XAUUSD', // Standard Gold/USD symbol (from Deriv support)
      'GOLD': 'XAUUSD',
      'XAU': 'XAUUSD',
      'XAUUSDmicro': 'XAUUSDmicro', // Gold/USD Micro symbol (from Deriv support)
    };
    
    const fallbackSymbol = fallbackMap[internalAsset.toUpperCase()];
    if (fallbackSymbol) {
      console.log(`[DerivAdapter] Fallback symbol found: ${fallbackSymbol}`);
      return fallbackSymbol;
    }
    
    console.log(`[DerivAdapter] No fallback symbol available for: ${internalAsset}`);
    throw new Error(`No fallback symbol available for ${internalAsset}`);
  }

  /**
   * Check if this is a demo account (safety check)
   */
  private async verifyDemoAccount(derivAccountId: string): Promise<boolean> {
    const derivAccount = await DerivAccount.findOne({ derivAccountId });
    if (!derivAccount) {
      throw new Error(`Deriv account not found: ${derivAccountId}`);
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
      status: { $in: ['PENDING', 'OPEN'] }
    });

    return existingTrade !== null;
  }

  /**
   * Initialize API client with user's access token and account ID
   */
  private async initializeApiClient(derivAccountId: string, accessToken: string): Promise<void> {
    const derivAccount = await DerivAccount.findOne({ derivAccountId });
    if (!derivAccount) {
      throw new Error(`Deriv account not found: ${derivAccountId}`);
    }

    // Create API client with OTP authentication
    this.apiClient = await createDerivApiClient(
      derivAccountId,
      accessToken,
      derivAccount.accountType
    );
  }

  /**
   * Execute trade using Deriv API
   */
  async executeTrade(request: InternalTradeRequest): Promise<ExecutionResult> {
    console.log(`[DerivAdapter] Executing trade for signal ${request.signalId}, user ${request.userId}`);

    const result: ExecutionResult = {
      success: false,
      broker: 'deriv',
      derivAccountId: request.derivAccountId,
      status: 'FAILED'
    };

    try {
      // Step 1: Get Deriv account and access token
      const derivAccount = await DerivAccount.findOne({ derivAccountId: request.derivAccountId });
      if (!derivAccount) {
        throw new Error(`Deriv account not found: ${request.derivAccountId}`);
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
      console.log(`[DerivAdapter] Demo account verified`);

      // Step 3: Check for duplicate execution (idempotency)
      const isDuplicate = await this.checkDuplicateExecution(
        request.signalId,
        request.userId,
        request.derivAccountId
      );

      if (isDuplicate) {
        result.error = 'DUPLICATE_EXECUTION';
        result.errorCode = 'DUPLICATE_EXECUTION';
        console.log(`[DerivAdapter] Duplicate execution detected, skipping`);
        return result;
      }

      // Step 4: Create pending copy trade record
      const copyTrade = new CopyTrade({
        signalId: request.signalId,
        userId: request.userId,
        derivAccountId: request.derivAccountId,
        broker: 'deriv',
        accountType: 'demo',
        asset: request.asset,
        direction: request.direction,
        sourceOrderType: request.sourceOrderType,
        sourceEntryPrice: request.sourceEntryPrice,
        stopLoss: request.stopLoss,
        takeProfit: request.takeProfit,
        takeProfits: [request.takeProfit], // Store single TP in array for audit
        stake: request.stake,
        status: 'PENDING',
        processedAt: new Date()
      });

      await copyTrade.save();
      console.log(`[DerivAdapter] Pending copy trade record created`);

      // Step 5: Initialize API client
      await this.initializeApiClient(request.derivAccountId, accessToken);
      console.log(`[DerivAdapter] API client initialized`);

      // Step 6: Translate internal trade to Deriv format
      const derivSymbol = await this.getDerivSymbol(request.asset, request.derivAccountId, accessToken, derivAccount.accountType);
      const contractType = this.translateDirection(request.direction);
      const stake = this.translateStake(request.stake);

      console.log(`[DerivAdapter] Translated trade: ${request.asset} -> ${derivSymbol}, ${request.direction} -> ${contractType}`);

      // Step 7: Get proposal from Deriv
      // For Deriv Multipliers:
      // - contract_type: MULTUP (BUY) or MULTDOWN (SELL)
      // - multiplier: leverage multiplier (e.g., 10 for 10x)
      // - SL/TP mechanism is unclear from documentation - direct fields are rejected
      // Note: Current Deriv documentation does not clearly show how to set SL/TP in proposal
      const proposalRequest = {
        proposal: 1,
        underlying_symbol: derivSymbol,
        contract_type: contractType,
        amount: stake,
        basis: 'stake' as const,
        currency: 'USD',
        duration_unit: 's', // Duration unit: 's' for seconds (as shown in Multipliers examples)
        multiplier: 10, // Multiplier for leverage (10x - this may need to be configurable)
        subscribe: 1,
        // SL/TP removed - direct fields are rejected by API
        // limit_order approach is not confirmed from official documentation
        // May need to be handled via contract_update or another mechanism
      };

      console.log(`[DerivAdapter] Requesting proposal with params:`, {
        underlying_symbol: derivSymbol,
        contract_type: contractType,
        amount: stake,
        basis: 'stake',
        currency: 'USD',
        duration_unit: 's',
        multiplier: 10,
        subscribe: 1,
        internal_symbol: request.asset,
        internal_direction: request.direction,
        internal_stake: request.stake,
        internal_stopLoss: request.stopLoss,
        internal_takeProfit: request.takeProfit,
        note: 'SL/TP not included in proposal - mechanism unclear from documentation'
      });
      let proposal;
      try {
        proposal = await this.apiClient!.getProposal(proposalRequest);
      } catch (proposalError) {
        // If proposal fails due to connection issue, try reconnecting with fresh OTP
        console.warn('[DerivAdapter] Proposal failed, attempting reconnection with fresh OTP', {
          error: proposalError instanceof Error ? proposalError.message : 'Unknown error'
        });
        try {
          await this.apiClient!.reconnect();
          console.log('[DerivAdapter] Reconnected, retrying proposal with same params');
          proposal = await this.apiClient!.getProposal(proposalRequest);
        } catch (reconnectError) {
          throw new Error(`Proposal failed after reconnection: ${reconnectError instanceof Error ? reconnectError.message : 'Unknown error'}`);
        }
      }
      console.log(`[DerivAdapter] Proposal received: ${proposal.id}`);

      // Step 8: Buy the contract
      const buyRequest = {
        proposal_id: proposal.id,
        price: proposal.ask_price
      };

      console.log(`[DerivAdapter] Buying contract`);
      let buyResponse;
      try {
        buyResponse = await this.apiClient!.buy(buyRequest);
      } catch (buyError) {
        // If buy fails due to connection issue, try reconnecting with fresh OTP
        console.warn('[DerivAdapter] Buy failed, attempting reconnection with fresh OTP');
        try {
          await this.apiClient!.reconnect();
          buyResponse = await this.apiClient!.buy(buyRequest);
        } catch (reconnectError) {
          throw new Error(`Buy failed after reconnection: ${reconnectError instanceof Error ? reconnectError.message : 'Unknown error'}`);
        }
      }
      console.log(`[DerivAdapter] Contract bought: ${buyResponse.contract_id}`);

      // Step 9: Skip post-purchase SL/TP update
      // Deriv Multipliers SL/TP mechanism is unclear from official documentation:
      // - Direct SL/TP fields in proposal are rejected by API
      // - limit_order in proposal is not confirmed from official docs
      // - contract_update is not supported for Multipliers (ContractUpdateNotAllowed error)
      // Current trade will execute without SL/TP protection
      console.warn(`[DerivAdapter] SL/TP NOT APPLIED - mechanism unclear from Deriv documentation`);
      console.warn(`[DerivAdapter] Trade will execute without Stop Loss/Take Profit protection`);
      console.warn(`[DerivAdapter] Required SL: ${request.stopLoss}, TP: ${request.takeProfit}`);

      // Step 10: Update copy trade record with success
      copyTrade.brokerContractId = buyResponse.contract_id;
      copyTrade.brokerTransactionId = buyResponse.transaction_id.toString();
      copyTrade.buyPrice = buyResponse.buy_price; // Use buyPrice instead of executionPrice
      copyTrade.actualEntrySpot = buyResponse.buy_price; // Set actual entry spot
      copyTrade.status = 'OPEN';
      copyTrade.openedAt = new Date();
      await copyTrade.save();

      // Step 11: Return success result
      result.success = true;
      result.brokerContractId = buyResponse.contract_id;
      result.brokerTransactionId = buyResponse.transaction_id.toString();
      result.executionPrice = buyResponse.buy_price;
      result.status = 'OPEN';
      result.rawReferenceData = {
        proposal,
        buy: buyResponse
      };

      console.log(`[DerivAdapter] Trade executed successfully`);
      return result;

    } catch (error) {
      console.error('[DerivAdapter] Trade execution failed with details:', {
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
        console.error('[DerivAdapter] Failed to update copy trade record:', updateError);
      }

      result.error = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      result.errorCode = error instanceof Error ? error.name : 'UNKNOWN_ERROR';
      return result;
    } finally {
      // Clean up API client
      if (this.apiClient) {
        this.apiClient.disconnect();
        this.apiClient = null;
      }
    }
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
export const derivAdapter = new DerivAdapter();

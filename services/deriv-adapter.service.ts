/**
 * Deriv Adapter Service (Phase 7)
 * Translates internal trade format to Deriv-specific API calls and executes trades
 * 
 * This service:
 * - Isolates Deriv-specific logic from the rest of the application
 * - Translates internal trade format to Deriv API format
 * - Executes proposal → buy workflow
 * - Applies SL/TP via contract_update if required
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
   * Get Deriv underlying symbol for internal symbol using the symbol mapper
   */
  private async getDerivSymbol(internalSymbol: string, derivAccountId: string, accessToken: string, accountType: 'demo' | 'real'): Promise<string> {
    // Check cache first
    const cached = this.symbolMappingCache.get(internalSymbol);
    if (cached) {
      console.log(`[DerivAdapter] Using cached symbol mapping: ${internalSymbol} -> ${cached.derivSymbol}`);
      return cached.derivSymbol;
    }

    // Discover symbol mapping using the symbol mapper
    const discoveryResult = await derivSymbolMapper.discoverSymbolMapping(internalSymbol, derivAccountId, accessToken, accountType);
    
    if (!discoveryResult.success) {
      throw new Error(`Failed to discover symbol mapping: ${discoveryResult.error}`);
    }
    
    // Cache the mapping
    this.symbolMappingCache.set(internalSymbol, discoveryResult.details!);
    
    return discoveryResult.derivSymbol!;
  }

  /**
   * Translate internal direction to Deriv contract type
   * This is a simplified mapping - actual contract types depend on the product
   */
  private translateDirection(direction: 'BUY' | 'SELL'): string {
    // This is a placeholder - actual contract types depend on the specific Deriv product
    // We'll need to determine the correct contract type based on the available contracts
    return direction === 'BUY' ? 'CALL' : 'PUT';
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
      // Note: This is a simplified proposal request
      // The actual parameters depend on the specific Deriv product/contract type
      const proposalRequest = {
        underlying_symbol: derivSymbol,
        contract_type: contractType,
        amount: stake,
        basis: 'stake' as const,
        currency: 'USD',
        duration: 1, // Default duration: 1 day
        duration_unit: 'd', // Duration unit: 'd' for day
        // Additional parameters would be added here based on the specific product
      };

      console.log(`[DerivAdapter] Requesting proposal with params:`, {
        underlying_symbol: derivSymbol,
        contract_type: contractType,
        amount: stake,
        basis: 'stake',
        currency: 'USD',
        duration: 1,
        duration_unit: 'd',
        internal_symbol: request.asset,
        internal_direction: request.direction,
        internal_lotSize: request.stake
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

      // Step 9: Apply SL/TP if supported by the product
      // This depends on whether the Deriv product supports post-purchase SL/TP updates
      try {
        const updateRequest = {
          contract_id: buyResponse.contract_id,
          stop_loss: request.stopLoss,
          take_profit: request.takeProfit
        };

        console.log(`[DerivAdapter] Applying SL/TP`);
        try {
          await this.apiClient!.updateContract(updateRequest);
          console.log(`[DerivAdapter] SL/TP applied`);
        } catch (updateError) {
          // If update fails due to connection issue, try reconnecting with fresh OTP
          console.warn('[DerivAdapter] SL/TP update failed, attempting reconnection with fresh OTP');
          try {
            await this.apiClient!.reconnect();
            await this.apiClient!.updateContract(updateRequest);
            console.log(`[DerivAdapter] SL/TP applied after reconnection`);
          } catch (reconnectError) {
            // SL/TP update might not be supported for all contract types
            // Log but don't fail the trade if SL/TP update fails
            console.warn(`[DerivAdapter] SL/TP update failed after reconnection (may not be supported):`, reconnectError);
          }
        }
      } catch (error) {
        // SL/TP update might not be supported for all contract types
        // Log but don't fail the trade if SL/TP update fails
        console.warn(`[DerivAdapter] SL/TP update failed (may not be supported):`, error);
      }

      // Step 10: Update copy trade record with success
      copyTrade.brokerContractId = buyResponse.contract_id;
      copyTrade.brokerTransactionId = buyResponse.transaction_id.toString();
      copyTrade.executionPrice = buyResponse.buy_price;
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

/**
 * Deriv API Client Service
 * Handles specific trading operations with Deriv WebSocket API
 * 
 * This service:
 * - Wraps WebSocket client for trading operations
 * - Implements proposal request for contract pricing
 * - Implements buy operation for contract execution
 * - Implements contract_update for SL/TP modification
 * - Handles Deriv-specific response formats
 * - Uses current Deriv API field names (underlying_symbol, etc.)
 */

import { DerivWebSocketClient, createDerivWebSocketClient, DerivMessage } from './deriv-websocket-client.service';

export interface ProposalRequest {
  underlying_symbol: string;
  contract_type: string;
  amount: number;
  basis: 'stake' | 'payout';
  currency?: string;
  duration?: number;
  duration_unit?: string;
  barrier?: string;
  barrier_type?: string;
  [key: string]: any;
}

export interface ProposalResponse {
  id: string;
  ask_price: number;
  payout: number;
  spot: number;
  spot_time: number;
  [key: string]: any;
}

export interface BuyRequest {
  proposal_id?: string;
  price?: number;
  parameters?: ProposalRequest;
}

export interface BuyResponse {
  contract_id: string;
  buy_price: number;
  payout: number;
  transaction_id: number;
  [key: string]: any;
}

export interface ContractUpdateRequest {
  contract_id: string;
  stop_loss?: number;
  take_profit?: number;
  [key: string]: any;
}

export interface ContractUpdateResponse {
  contract_id: string;
  stop_loss?: number;
  take_profit?: number;
  [key: string]: any;
}

export interface PortfolioResponse {
  portfolio: Array<{
    contract_id: string;
    contract_type: string;
    underlying_symbol: string;
    buy_price: number;
    payout: number;
    profit: number;
    status: string;
    [key: string]: any;
  }>;
}

/**
 * Deriv API Client for trading operations
 */
export class DerivApiClient {
  private wsClient: DerivWebSocketClient;

  constructor(wsClient: DerivWebSocketClient) {
    this.wsClient = wsClient;
  }

  /**
   * Get active symbols from Deriv
   * This helps us verify the correct underlying symbol for XAUUSD
   */
  async getActiveSymbols(): Promise<any[]> {
    const request = {
      active_symbols: 'brief',
      req_id: Date.now()
    };

    const response = await this.wsClient.sendAndWait<any>(request);
    
    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.active_symbols || [];
  }

  /**
   * Get contracts available for a specific underlying symbol
   */
  async getContractsFor(underlyingSymbol: string): Promise<any> {
    const request = {
      contracts_for: underlyingSymbol,
      req_id: Date.now()
    };

    const response = await this.wsClient.sendAndWait<any>(request);
    
    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.contracts_for || {};
  }

  /**
   * Request a price proposal for a contract
   * This is the first step in the trading workflow
   */
  async getProposal(request: ProposalRequest): Promise<ProposalResponse> {
    const derivRequest = {
      proposal: 1,
      ...request,
      subscribe: 0, // We don't need subscription for one-time proposal
      req_id: Date.now()
    };

    const response = await this.wsClient.sendAndWait<any>(derivRequest);
    
    if (response.error) {
      throw new Error(response.error.message);
    }

    const proposal = response.proposal;
    if (!proposal) {
      throw new Error('No proposal data in response');
    }

    return {
      id: proposal.id,
      ask_price: proposal.ask_price,
      payout: proposal.payout,
      spot: proposal.spot,
      spot_time: proposal.spot_time,
      ...proposal
    };
  }

  /**
   * Buy a contract using a proposal ID
   * This executes the trade
   */
  async buy(request: BuyRequest): Promise<BuyResponse> {
    const derivRequest: any = {
      buy: request.proposal_id || 1,
      price: request.price,
      req_id: Date.now()
    };

    // If passing parameters directly instead of proposal ID
    if (request.parameters && !request.proposal_id) {
      Object.assign(derivRequest, request.parameters);
    }

    const response = await this.wsClient.sendAndWait<any>(derivRequest);
    
    if (response.error) {
      throw new Error(response.error.message);
    }

    const buy = response.buy;
    if (!buy) {
      throw new Error('No buy data in response');
    }

    return {
      contract_id: buy.contract_id,
      buy_price: buy.buy_price,
      payout: buy.payout,
      transaction_id: buy.transaction_id,
      ...buy
    };
  }

  /**
   * Update contract settings (stop loss, take profit)
   * This is used after purchase to apply SL/TP
   */
  async updateContract(request: ContractUpdateRequest): Promise<ContractUpdateResponse> {
    const derivRequest = {
      contract_update: 1,
      contract_id: request.contract_id,
      stop_loss: request.stop_loss,
      take_profit: request.take_profit,
      req_id: Date.now()
    };

    const response = await this.wsClient.sendAndWait<any>(derivRequest);
    
    if (response.error) {
      throw new Error(response.error.message);
    }

    const contractUpdate = response.contract_update;
    if (!contractUpdate) {
      throw new Error('No contract_update data in response');
    }

    return {
      contract_id: contractUpdate.contract_id,
      stop_loss: contractUpdate.stop_loss,
      take_profit: contractUpdate.take_profit,
      ...contractUpdate
    };
  }

  /**
   * Get portfolio (open positions) for the authorized account
   */
  async getPortfolio(): Promise<PortfolioResponse> {
    const request = {
      portfolio: 1,
      req_id: Date.now()
    };

    const response = await this.wsClient.sendAndWait<any>(request);
    
    if (response.error) {
      throw new Error(response.error.message);
    }

    return {
      portfolio: response.portfolio || []
    };
  }

  /**
   * Get status of an open contract
   */
  async getOpenContract(contractId: string): Promise<any> {
    const request = {
      proposal_open_contract: 1,
      contract_id: contractId,
      req_id: Date.now()
    };

    const response = await this.wsClient.sendAndWait<any>(request);
    
    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.proposal_open_contract;
  }

  /**
   * Close (sell) a contract
   */
  async sellContract(contractId: number, price: number): Promise<any> {
    const request = {
      sell: contractId,
      price: price,
      req_id: Date.now()
    };

    const response = await this.wsClient.sendAndWait<any>(request);
    
    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.sell;
  }

  /**
   * Disconnect the WebSocket client
   */
  disconnect(): void {
    this.wsClient.disconnect();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.wsClient.isConnected();
  }
}

/**
 * Factory function to create a Deriv API client
 */
export async function createDerivApiClient(
  accessToken: string,
  accountType: 'demo' | 'real'
): Promise<DerivApiClient> {
  const wsClient = createDerivWebSocketClient(accessToken, accountType);
  await wsClient.connect();
  
  return new DerivApiClient(wsClient);
}

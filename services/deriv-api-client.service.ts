/**
 * Deriv API Client Service
 * Handles specific trading operations with Deriv WebSocket API
 * 
 * This service:
 * - Wraps WebSocket client for trading operations
 * - Implements OTP authentication for current Deriv Options API
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
 * Request authenticated WebSocket URL using OTP
 * This implements the current Deriv Options API authentication flow
 * 
 * @param derivAccountId - The Deriv account ID (e.g., "DOT94539279")
 * @param accessToken - The OAuth access token (decrypted)
 * @param accountType - Account type ('demo' or 'real') - must be 'demo' for execution
 * @returns Authenticated WebSocket URL with OTP
 */
export async function getAuthenticatedWebSocketUrl(
  derivAccountId: string,
  accessToken: string,
  accountType: 'demo' | 'real'
): Promise<string> {
  console.log('[DerivApiClient] Requesting authenticated WebSocket URL', {
    derivAccountId: derivAccountId.substring(0, 8) + '...',
    accountType: accountType
  });

  // Demo-only safety check
  if (accountType !== 'demo') {
    console.error('[DerivApiClient] EXECUTION_BLOCKED_REAL_ACCOUNT_NOT_SUPPORTED', {
      derivAccountId: derivAccountId.substring(0, 8) + '...',
      accountType: accountType
    });
    throw new Error('EXECUTION_BLOCKED_REAL_ACCOUNT_NOT_SUPPORTED');
  }

  const otpEndpoint = `https://api.derivws.com/trading/v1/options/accounts/${derivAccountId}/otp`;

  console.log('[DerivApiClient] OTP request details', {
    endpoint: otpEndpoint.replace(derivAccountId, derivAccountId.substring(0, 8) + '...'),
    method: 'POST',
    hasAuth: !!accessToken,
    accountType: accountType
  });

  try {
    const response = await fetch(otpEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DerivApiClient] OTP request HTTP error', {
        status: response.status,
        statusText: response.statusText,
        derivAccountId: derivAccountId.substring(0, 8) + '...',
        errorBody: errorText.substring(0, 500)
      });
      throw new Error(`OTP generation failed: HTTP ${response.status} - ${response.statusText}`);
    }

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[DerivApiClient] Failed to parse OTP response', {
        contentType: response.headers.get('content-type'),
        responseBody: responseText.substring(0, 500)
      });
      throw new Error('Invalid JSON response from OTP endpoint');
    }

    // Log safe response structure for debugging
    console.log('[DerivApiClient] OTP response structure', {
      httpStatus: response.status,
      hasData: !!responseData.data,
      dataType: typeof responseData.data,
      dataKeys: responseData.data ? Object.keys(responseData.data) : [],
      topLevelKeys: Object.keys(responseData),
      hasDataUrl: !!(responseData.data?.url),
      dataUrlType: typeof responseData.data?.url,
      // Check for alternative field names in case API structure differs
      hasWsUrl: !!(responseData.ws_url),
      hasWebsocketUrl: !!(responseData.websocket_url),
      hasTopLevelUrl: !!(responseData.url)
    });

    // Extract WebSocket URL from response
    // Try multiple possible field names based on different API versions
    let wsUrl = responseData.data?.url;
    
    // Fallback to alternative field names if data.url is not present
    if (!wsUrl) {
      wsUrl = responseData.ws_url || responseData.websocket_url || responseData.url;
    }

    if (!wsUrl || typeof wsUrl !== 'string') {
      console.error('[DerivApiClient] No WebSocket URL in OTP response', {
        httpStatus: response.status,
        hasData: !!responseData.data,
        dataKeys: responseData.data ? Object.keys(responseData.data) : [],
        topLevelKeys: Object.keys(responseData),
        hasWsUrl: !!(responseData.ws_url),
        hasWebsocketUrl: !!(responseData.websocket_url),
        hasTopLevelUrl: !!(responseData.url),
        derivAccountId: derivAccountId.substring(0, 8) + '...'
      });
      throw new Error(`No WebSocket URL returned from OTP endpoint (HTTP ${response.status})`);
    }

    // Validate the URL format
    if (!wsUrl.startsWith('wss://api.derivws.com/trading/v1/options/ws/')) {
      console.error('[DerivApiClient] Invalid WebSocket URL format', {
        urlPrefix: wsUrl.substring(0, 50) + '...',
        expectedPrefix: 'wss://api.derivws.com/trading/v1/options/ws/'
      });
      throw new Error('Invalid WebSocket URL format returned from OTP endpoint');
    }

    console.log('[DerivApiClient] Successfully obtained authenticated WebSocket URL', {
      urlPrefix: wsUrl.substring(0, 60) + '...',
      hasOtp: wsUrl.includes('otp=')
    });

    // Security: Never log or persist the OTP
    // The URL is returned directly to the caller and used immediately
    return wsUrl;

  } catch (error) {
    console.error('[DerivApiClient] OTP authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      derivAccountId: derivAccountId.substring(0, 8) + '...'
    });
    throw error;
  }
}

/**
 * Deriv API Client for trading operations
 */
export class DerivApiClient {
  private wsClient: DerivWebSocketClient;
  private derivAccountId: string;
  private accessToken: string;
  private accountType: 'demo' | 'real';

  constructor(wsClient: DerivWebSocketClient, derivAccountId: string, accessToken: string, accountType: 'demo' | 'real') {
    this.wsClient = wsClient;
    this.derivAccountId = derivAccountId;
    this.accessToken = accessToken;
    this.accountType = accountType;
  }

  /**
   * Get account information including balance
   * This is used to fetch current account balance
   */
  async getAccountInfo(): Promise<{
    balance: number;
    currency: string;
    loginid: string;
    [key: string]: any;
  }> {
    const request = {
      account_info: 1,
      req_id: Date.now()
    };

    const response = await this.wsClient.sendAndWait<any>(request);
    
    if (response.error) {
      throw new Error(response.error.message);
    }

    const accountInfo = response.account_info;
    if (!accountInfo) {
      throw new Error('No account info in response');
    }

    return {
      balance: parseFloat(accountInfo.balance || '0'),
      currency: accountInfo.currency || 'USD',
      loginid: accountInfo.loginid || '',
      ...accountInfo
    };
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
      subscribe: 1, // Current Deriv Options API requires subscribe: 1
      req_id: Date.now()
    };

    console.log('[DerivApiClient] PROPOSAL REQUEST:', JSON.stringify({
      proposal: derivRequest.proposal,
      underlying_symbol: derivRequest.underlying_symbol,
      contract_type: derivRequest.contract_type,
      amount: derivRequest.amount,
      basis: derivRequest.basis,
      currency: derivRequest.currency,
      subscribe: derivRequest.subscribe,
      subscribe_type: typeof derivRequest.subscribe
    }, null, 2));

    const response = await this.wsClient.sendAndWait<any>(derivRequest);
    
    console.log('[DerivApiClient] PROPOSAL RAW RESPONSE:', JSON.stringify({
      msg_type: response.msg_type,
      error: response.error ? {
        code: response.error.code,
        message: response.error.message,
        fields: response.error.fields
      } : null,
      proposal: response.proposal ? {
        id: response.proposal.id,
        ask_price: response.proposal.ask_price,
        payout: response.proposal.payout,
        spot: response.proposal.spot
      } : null,
      echo_req: response.echo_req
    }, null, 2));
    
    if (response.error) {
      console.error('[DerivApiClient] PROPOSAL ERROR DETAILS:', {
        error_code: response.error.code,
        error_message: response.error.message,
        error_type: typeof response.error,
        full_error: response.error
      });
      throw new Error(response.error.message);
    }

    const proposal = response.proposal;
    if (!proposal) {
      console.error('[DerivApiClient] PROPOSAL ERROR: No proposal data in response');
      throw new Error('No proposal data in response');
    }

    console.log('[DerivApiClient] PROPOSAL SUCCESS:', {
      proposal_id: proposal.id,
      ask_price: proposal.ask_price,
      payout: proposal.payout,
      spot: proposal.spot
    });

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

    console.log('[DerivApiClient] BUY REQUEST:', JSON.stringify({
      ...derivRequest,
      // Don't log sensitive fields if any
    }, null, 2));

    const response = await this.wsClient.sendAndWait<any>(derivRequest);
    
    console.log('[DerivApiClient] BUY RAW RESPONSE:', JSON.stringify({
      msg_type: response.msg_type,
      error: response.error,
      buy: response.buy ? {
        contract_id: response.buy.contract_id,
        buy_price: response.buy.buy_price,
        payout: response.buy.payout,
        transaction_id: response.buy.transaction_id
      } : null,
      echo_req: response.echo_req
    }, null, 2));
    
    if (response.error) {
      console.error('[DerivApiClient] BUY ERROR DETAILS:', {
        error_code: response.error.code,
        error_message: response.error.message,
        error_type: typeof response.error,
        full_error: response.error,
        msg_type: response.msg_type
      });
      throw new Error(response.error.message);
    }

    const buy = response.buy;
    if (!buy) {
      console.error('[DerivApiClient] BUY ERROR: No buy data in response');
      throw new Error('No buy data in response');
    }

    console.log('[DerivApiClient] BUY SUCCESS:', {
      contract_id: buy.contract_id,
      buy_price: buy.buy_price,
      payout: buy.payout,
      transaction_id: buy.transaction_id
    });

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
      limit_order: {
        stop_loss: request.stop_loss,
        take_profit: request.take_profit
      },
      req_id: Date.now()
    };

    console.log('[DerivApiClient] CONTRACT_UPDATE REQUEST:', JSON.stringify({
      ...derivRequest,
      // Don't log sensitive fields if any
    }, null, 2));

    const response = await this.wsClient.sendAndWait<any>(derivRequest);
    
    console.log('[DerivApiClient] CONTRACT_UPDATE RAW RESPONSE:', JSON.stringify({
      msg_type: response.msg_type,
      error: response.error,
      contract_update: response.contract_update ? {
        contract_id: response.contract_update.contract_id,
        stop_loss: response.contract_update.stop_loss,
        take_profit: response.contract_update.take_profit
      } : null,
      echo_req: response.echo_req
    }, null, 2));
    
    if (response.error) {
      console.error('[DerivApiClient] CONTRACT_UPDATE ERROR DETAILS:', {
        error_code: response.error.code,
        error_message: response.error.message,
        error_type: typeof response.error,
        full_error: response.error,
        msg_type: response.msg_type
      });
      throw new Error(response.error.message);
    }

    const contractUpdate = response.contract_update;
    if (!contractUpdate) {
      console.error('[DerivApiClient] CONTRACT_UPDATE ERROR: No contract_update data in response');
      throw new Error('No contract_update data in response');
    }

    console.log('[DerivApiClient] CONTRACT_UPDATE SUCCESS:', {
      contract_id: contractUpdate.contract_id,
      stop_loss: contractUpdate.stop_loss,
      take_profit: contractUpdate.take_profit
    });

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

  /**
   * Reconnect with fresh OTP
   * This is required when the WebSocket connection fails or closes
   * because OTPs are single-use and short-lived
   */
  async reconnect(): Promise<void> {
    console.log('[DerivApiClient] Reconnecting with fresh OTP', {
      derivAccountId: this.derivAccountId.substring(0, 8) + '...',
      accountType: this.accountType
    });

    // Disconnect existing client
    this.wsClient.disconnect();

    // Request fresh OTP and get new authenticated URL
    const freshAuthenticatedUrl = await getAuthenticatedWebSocketUrl(
      this.derivAccountId,
      this.accessToken,
      this.accountType
    );

    // Create new WebSocket client with fresh authenticated URL
    const newWsClient = createDerivWebSocketClient(freshAuthenticatedUrl, this.accountType);
    await newWsClient.connect();

    // Replace the old client
    this.wsClient = newWsClient;

    console.log('[DerivApiClient] Reconnected successfully with fresh OTP');
  }
}

/**
 * Factory function to create a Deriv API client with OTP authentication
 * 
 * @param derivAccountId - The Deriv account ID (e.g., "DOT94539279")
 * @param accessToken - The OAuth access token (decrypted)
 * @param accountType - Account type ('demo' or 'real')
 */
export async function createDerivApiClient(
  derivAccountId: string,
  accessToken: string,
  accountType: 'demo' | 'real'
): Promise<DerivApiClient> {
  // Request authenticated WebSocket URL using OTP
  const authenticatedWsUrl = await getAuthenticatedWebSocketUrl(
    derivAccountId,
    accessToken,
    accountType
  );
  
  // Create WebSocket client with authenticated URL
  const wsClient = createDerivWebSocketClient(authenticatedWsUrl, accountType);
  await wsClient.connect();
  
  // Create API client with credentials for potential reconnection
  return new DerivApiClient(wsClient, derivAccountId, accessToken, accountType);
}

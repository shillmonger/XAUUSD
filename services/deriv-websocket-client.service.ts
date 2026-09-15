/**
 * Deriv WebSocket Client Service
 * Handles authenticated WebSocket connections to Deriv for trading operations
 * 
 * This service:
 * - Manages WebSocket connections to Deriv's authenticated Options API endpoints
 * - Uses OTP-based authentication from current Deriv Options API
 * - Sends/receives JSON messages for trading operations
 * - Handles proposal, buy, contract_update operations
 * - Does NOT perform legacy authorize() handshake (OTP authenticates the connection)
 */

import WebSocket from 'ws';

export interface DerivWebSocketConfig {
  authenticatedUrl: string; // Complete authenticated URL with OTP
  accountType: 'demo' | 'real';
}

export interface DerivMessage {
  msg_type: string;
  [key: string]: any;
}

export interface DerivRequest {
  [key: string]: any;
  req_id?: number;
}

export type MessageHandler = (message: DerivMessage) => void;
export type ErrorHandler = (error: Error) => void;

/**
 * Deriv WebSocket Client for authenticated trading operations
 */
export class DerivWebSocketClient {
  private ws: WebSocket | null = null;
  private config: DerivWebSocketConfig;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private errorHandlers: ErrorHandler[] = [];
  private requestPromises: Map<number, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private reqIdCounter = 0;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 5000;

  constructor(config: DerivWebSocketConfig) {
    this.config = config;
  }

  /**
   * Get the authenticated WebSocket endpoint
   * This uses the complete authenticated URL with OTP from the OTP endpoint
   */
  private getWebSocketEndpoint(): string {
    // Return the complete authenticated URL provided by the OTP endpoint
    // This URL already contains the OTP and is ready to use
    return this.config.authenticatedUrl;
  }

  /**
   * Connect to Deriv WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const endpoint = this.getWebSocketEndpoint();
        console.log('[DerivWebSocketClient] Connection details:', {
          endpoint: endpoint.substring(0, 60) + '...', // Redact OTP for security
          account_type: this.config.accountType,
          hasOtp: endpoint.includes('otp=')
        });

        // Set connection timeout for Vercel environment
        const connectionTimeout = setTimeout(() => {
          if (this.ws) {
            this.ws.terminate();
          }
          reject(new Error('WebSocket connection timeout after 15 seconds'));
        }, 15000);

        this.ws = new WebSocket(endpoint);

        this.ws.on('open', () => {
          clearTimeout(connectionTimeout);
          console.log('[DerivWebSocketClient] WebSocket connected successfully (OTP authenticated)');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.ws.on('message', (data: string) => {
          try {
            const message = JSON.parse(data) as DerivMessage;
            this.handleMessage(message);
          } catch (error) {
            console.error('[DerivWebSocketClient] Failed to parse message:', error);
          }
        });

        this.ws.on('error', (error: Error) => {
          clearTimeout(connectionTimeout);
          console.error('[DerivWebSocketClient] WebSocket error details:', {
            error_message: error.message,
            error_name: error.name,
            error_stack: error.stack,
            error_type: typeof error
          });
          this.notifyErrorHandlers(error);
          reject(error);
        });

        this.ws.on('close', () => {
          clearTimeout(connectionTimeout);
          console.log('[DerivWebSocketClient] WebSocket closed');
          this.handleReconnect();
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send a request to Deriv WebSocket
   */
  send(request: DerivRequest): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message = JSON.stringify(request);
    console.log(`[DerivWebSocketClient] Sending:`, message);
    this.ws.send(message);
  }

  /**
   * Send a request and wait for response
   */
  async sendAndWait<T = any>(request: DerivRequest, timeout: number = 30000): Promise<T> {
    const reqId = this.nextReqId();
    request.req_id = reqId;

    return new Promise((resolve, reject) => {
      this.setupRequestPromise(reqId, resolve, reject, timeout);
      this.send(request);
    });
  }

  /**
   * Setup a promise for a specific request ID
   */
  private setupRequestPromise(
    reqId: number,
    resolve: (value: any) => void,
    reject: (reason: any) => void,
    timeout: number
  ): void {
    const timeoutHandle = setTimeout(() => {
      this.requestPromises.delete(reqId);
      reject(new Error(`Request ${reqId} timed out after ${timeout}ms`));
    }, timeout);

    this.requestPromises.set(reqId, { resolve, reject, timeout: timeoutHandle });
  }

  /**
   * Handle incoming message from WebSocket
   */
  private handleMessage(message: DerivMessage): void {
    console.log('[DerivWebSocketClient] Received message details:', {
      msg_type: message.msg_type,
      req_id: message.req_id,
      error: message.error ? {
        code: message.error.code,
        message: message.error.message,
        type: typeof message.error
      } : null,
      has_proposal: !!message.proposal,
      has_buy: !!message.buy,
      has_contract_update: !!message.contract_update,
      has_account_info: !!message.account_info,
      echo_req: message.echo_req ? 'present' : 'absent',
      pending_requests: this.requestPromises.size
    });

    // Check if this is a response to a specific request
    if (message.req_id !== undefined && this.requestPromises.has(message.req_id)) {
      const { resolve, reject, timeout } = this.requestPromises.get(message.req_id)!;
      clearTimeout(timeout);
      this.requestPromises.delete(message.req_id);

      // Check for error in response
      if (message.error) {
        console.error('[DerivWebSocketClient] Request error details:', {
          req_id: message.req_id,
          error_code: message.error.code,
          error_message: message.error.message,
          error_type: typeof message.error,
          full_error: message.error,
          msg_type: message.msg_type
        });
        
        // Special handling for authorization errors
        if (message.error.code === 'InvalidToken' || message.error.code === 'AuthorizationRequired') {
          reject(new Error(`Deriv authorization failed: ${message.error.message} (Code: ${message.error.code})`));
        } else {
          reject(new Error(message.error.message || 'Deriv API error'));
        }
      } else {
        resolve(message);
      }
    } else {
      // Handle messages without matching request ID
      if (message.error) {
        console.warn('[DerivWebSocketClient] Received error message without matching request:', {
          msg_type: message.msg_type,
          error: message.error,
          req_id: message.req_id
        });
        // Don't throw error for unsolicited error messages
      } else {
        console.log('[DerivWebSocketClient] Received unsolicited message (no matching request):', {
          msg_type: message.msg_type,
          req_id: message.req_id
        });
      }
    }

    // Notify message handlers by message type
    const msgType = message.msg_type;
    if (msgType && this.messageHandlers.has(msgType)) {
      const handlers = this.messageHandlers.get(msgType)!;
      handlers.forEach(handler => handler(message));
    }
  }

  /**
   * Register a handler for a specific message type
   */
  on(msgType: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(msgType)) {
      this.messageHandlers.set(msgType, []);
    }
    this.messageHandlers.get(msgType)!.push(handler);
  }

  /**
   * Register an error handler
   */
  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  /**
   * Notify all error handlers
   */
  private notifyErrorHandlers(error: Error): void {
    this.errorHandlers.forEach(handler => handler(error));
  }

  /**
   * Handle reconnection logic
   * Note: With OTP authentication, reconnection requires a fresh OTP
   * This should be handled at a higher level (DerivApiClient) by creating a new client
   * The WebSocket client itself cannot request a new OTP as it lacks account credentials
   */
  private handleReconnect(): void {
    console.log('[DerivWebSocketClient] WebSocket closed - reconnection requires fresh OTP at higher level');
    // With OTP flow, automatic reconnection is not safe because:
    // 1. OTPs are single-use and short-lived
    // 2. The WebSocket client doesn't have access to account ID/access token
    // 3. Reconnection must be handled by DerivApiClient with fresh OTP
    // The calling layer should detect disconnection and create a new client
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    // Clear all pending requests
    this.requestPromises.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('WebSocket disconnected'));
    });
    this.requestPromises.clear();
  }

  /**
   * Generate next request ID
   */
  private nextReqId(): number {
    return ++this.reqIdCounter;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * Factory function to create a Deriv WebSocket client with authenticated URL
 * This should be called with the complete authenticated WebSocket URL from the OTP endpoint
 * 
 * @param authenticatedUrl - Complete authenticated WebSocket URL with OTP (e.g., wss://api.derivws.com/trading/v1/options/ws/demo?otp=...)
 * @param accountType - Account type ('demo' or 'real')
 */
export function createDerivWebSocketClient(
  authenticatedUrl: string,
  accountType: 'demo' | 'real'
): DerivWebSocketClient {
  const config: DerivWebSocketConfig = {
    authenticatedUrl,
    accountType
  };

  return new DerivWebSocketClient(config);
}

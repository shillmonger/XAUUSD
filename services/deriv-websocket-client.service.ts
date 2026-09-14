/**
 * Deriv WebSocket Client Service
 * Handles authenticated WebSocket connections to Deriv for trading operations
 * 
 * This service:
 * - Manages WebSocket connections to Deriv's demo/real endpoints
 * - Uses existing encrypted access tokens for authentication
 * - Sends/receives JSON messages for trading operations
 * - Handles proposal, buy, contract_update operations
 * - Reuses existing token encryption/decryption from lib/encryption.ts
 */

import WebSocket from 'ws';
import { decrypt } from '@/lib/encryption';

export interface DerivWebSocketConfig {
  accessToken: string;
  appId: string;
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
   * Get the appropriate WebSocket endpoint based on account type
   */
  private getWebSocketEndpoint(): string {
    // Deriv uses different endpoints for demo vs real accounts
    // Based on current Deriv API documentation
    if (this.config.accountType === 'demo') {
      return 'wss://ws.derivws.com/websockets/v3?app_id=' + this.config.appId;
    } else {
      return 'wss://ws.derivws.com/websockets/v3?app_id=' + this.config.appId;
    }
  }

  /**
   * Connect to Deriv WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const endpoint = this.getWebSocketEndpoint();
        console.log('[DerivWebSocketClient] Connection details:', {
          endpoint: endpoint,
          account_type: this.config.accountType,
          app_id: this.config.appId,
          token_length: this.config.accessToken.length,
          token_prefix: this.config.accessToken.substring(0, 10) + '...'
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
          console.log('[DerivWebSocketClient] WebSocket connected successfully');
          this.reconnectAttempts = 0;
          
          // Authorize using the access token
          this.authorize().then(() => {
            console.log('[DerivWebSocketClient] Authorization successful');
            resolve();
          }).catch((error) => {
            console.error('[DerivWebSocketClient] Authorization failed:', error);
            reject(error);
          });
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
   * Authorize the WebSocket connection using access token
   */
  private async authorize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const reqId = this.nextReqId();

      const request: DerivRequest = {
        authorize: this.config.accessToken,
        req_id: reqId
      };

      console.log('[DerivWebSocketClient] Authorization request details:', {
        req_id: reqId,
        account_type: this.config.accountType,
        app_id: this.config.appId,
        token_prefix: this.config.accessToken.substring(0, 10) + '...',
        token_length: this.config.accessToken.length
      });

      this.setupRequestPromise(reqId, resolve, reject, 15000); // Increased timeout to 15 seconds
      this.send(request);
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
      echo_req: message.echo_req ? 'present' : 'absent'
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
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[DerivWebSocketClient] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('[DerivWebSocketClient] Reconnection failed:', error);
        });
      }, this.reconnectDelay);
    } else {
      console.error('[DerivWebSocketClient] Max reconnection attempts reached');
    }
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
 * Factory function to create a Deriv WebSocket client using existing encrypted token
 * This should be called with already-decrypted access token to avoid circular dependencies
 */
export function createDerivWebSocketClient(
  accessToken: string,
  accountType: 'demo' | 'real'
): DerivWebSocketClient {
  const config: DerivWebSocketConfig = {
    accessToken,
    appId: process.env.DERIV_CLIENT_ID || '',
    accountType
  };

  return new DerivWebSocketClient(config);
}

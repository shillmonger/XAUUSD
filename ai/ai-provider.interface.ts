/**
 * Signal Intelligence Engine Interface
 * Defines the contract for internal signal intelligence engines
 * This abstraction allows the platform to work with different signal extraction implementations
 */

export interface SignalEngine {
  /**
   * Extract trading signal from a Telegram message
   * @param messageText - The Telegram message text to analyze
   * @returns Promise with the extracted signal result
   */
  extractSignal(messageText: string): Promise<SignalExtractionResult>;

  /**
   * Get the engine name for logging/debugging
   */
  getEngineName(): string;

  /**
   * Get the engine version
   */
  getEngineVersion(): string;
}

export interface SignalExtractionResult {
  isValidSignal: boolean;
  symbol?: string;
  direction?: 'BUY' | 'SELL';
  orderType?: 'MARKET' | 'LIMIT' | 'STOP';
  entry?: number;
  stopLoss?: number;
  takeProfits?: number[];
}
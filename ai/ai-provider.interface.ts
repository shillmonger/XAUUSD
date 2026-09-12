/**
 * AI Provider Interface
 * Defines the contract for AI providers (NaraRouter, OpenAI, etc.)
 * This abstraction allows the signal engine to work with different AI providers
 */

export interface AIProvider {
  /**
   * Send a request to the AI provider
   * @param systemPrompt - The system prompt/instructions
   * @param userMessage - The user message to process
   * @param model - The AI model to use
   * @returns Promise with the AI response
   */
  sendRequest(systemPrompt: string, userMessage: string, model: string): Promise<string>;

  /**
   * Get the provider name for logging/debugging
   */
  getProviderName(): string;
}

export interface AISignalExtractionResult {
  isValidSignal: boolean;
  symbol?: string;
  direction?: 'BUY' | 'SELL';
  orderType?: 'MARKET' | 'LIMIT' | 'STOP';
  entry?: number;
  stopLoss?: number;
  takeProfits?: number[];
}
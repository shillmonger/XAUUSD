/**
 * Signal AI Service
 * Orchestrates AI-based signal extraction from Telegram messages
 * Uses the AI provider interface to make requests and validate responses
 */

import { AIProvider } from './ai-provider.interface';
import { NaraRouterProvider } from './nararouter.provider';
import { getSystemPrompt, AI_PROMPT_VERSION } from './prompt';
import { safeValidateSignalExtraction, SignalExtractionResult } from './signal-schema';

export class SignalAIService {
  private aiProvider: AIProvider;
  private model: string;

  constructor() {
    // Initialize with NaraRouter provider
    this.aiProvider = new NaraRouterProvider();
    this.model = process.env.AI_MODEL || 'deepseek-v4.1-flash-free';
  }

  /**
   * Extract trading signal from a Telegram message
   * @param messageText - The Telegram message text to analyze
   * @returns Promise with the extracted signal or null if extraction fails
   */
  async extractSignal(messageText: string): Promise<{
    success: boolean;
    result?: SignalExtractionResult;
    error?: string;
  }> {
    try {
      console.log(`[AI Service] Starting signal extraction for message: "${messageText.substring(0, 50)}..."`);

      // Get the system prompt
      const systemPrompt = getSystemPrompt(AI_PROMPT_VERSION);

      // Send request to AI provider
      const aiResponse = await this.aiProvider.sendRequest(
        systemPrompt,
        messageText,
        this.model
      );

      console.log(`[AI Service] AI response received`);

      // Parse the AI response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiResponse);
      } catch (parseError) {
        console.error(`[AI Service] Failed to parse AI response as JSON:`, parseError);
        return {
          success: false,
          error: 'Failed to parse AI response as JSON'
        };
      }

      // Validate against schema
      const validationResult = safeValidateSignalExtraction(parsedResponse);

      if (!validationResult.success) {
        console.error(`[AI Service] Schema validation failed:`, validationResult.error);
        return {
          success: false,
          error: validationResult.error
        };
      }

      console.log(`[AI Service] Signal extraction completed successfully`);
      console.log(`[AI Service] Result:`, JSON.stringify(validationResult.data));

      return {
        success: true,
        result: validationResult.data
      };

    } catch (error) {
      console.error(`[AI Service] Signal extraction failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get the AI provider name for logging
   */
  getProviderName(): string {
    return this.aiProvider.getProviderName();
  }

  /**
   * Get the AI model being used
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Get the prompt version being used
   */
  getPromptVersion(): string {
    return AI_PROMPT_VERSION;
  }
}
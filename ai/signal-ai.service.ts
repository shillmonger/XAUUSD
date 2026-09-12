/**
 * Signal Intelligence Service
 * Orchestrates internal signal intelligence engine for extracting trading signals from Telegram messages
 * Uses the internal signal engine instead of external AI providers
 */

import { SignalEngine } from './ai-provider.interface';
import { InternalSignalEngine } from './signal-engine.service';
import { validateSignal } from './signal-validator';
import { SignalExtractionResult } from './signal-schema';

export class SignalIntelligenceService {
  private signalEngine: SignalEngine;

  constructor() {
    // Initialize with internal signal engine
    this.signalEngine = new InternalSignalEngine();
  }

  /**
   * Extract and validate trading signal from a Telegram message
   * @param messageText - The Telegram message text to analyze
   * @returns Promise with the extracted and validated signal or null if extraction/validation fails
   */
  async extractAndValidateSignal(messageText: string): Promise<{
    success: boolean;
    extractionResult?: SignalExtractionResult;
    validationResult?: any;
    error?: string;
  }> {
    try {
      console.log(`[Signal Intelligence Service] Starting signal extraction and validation for message: "${messageText.substring(0, 50)}..."`);

      // Step 1: Extract signal using internal engine
      const extractionResult = await this.signalEngine.extractSignal(messageText);

      if (!extractionResult.isValidSignal) {
        console.log(`[Signal Intelligence Service] Signal extraction failed - not a valid signal`);
        return {
          success: false,
          extractionResult,
          error: 'Not a valid trading signal'
        };
      }

      console.log(`[Signal Intelligence Service] Signal extraction successful`);

      // Step 2: Validate signal using deterministic validator
      const validationResult = validateSignal(extractionResult);

      if (!validationResult.isValid) {
        console.log(`[Signal Intelligence Service] Signal validation failed: ${validationResult.reason}`);
        return {
          success: false,
          extractionResult,
          validationResult,
          error: validationResult.reason
        };
      }

      console.log(`[Signal Intelligence Service] Signal validation successful`);
      console.log(`[Signal Intelligence Service] Final result:`, JSON.stringify(validationResult.validatedSignal));

      return {
        success: true,
        extractionResult,
        validationResult,
      };

    } catch (error) {
      console.error(`[Signal Intelligence Service] Signal extraction and validation failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get the signal engine name for logging
   */
  getEngineName(): string {
    return this.signalEngine.getEngineName();
  }

  /**
   * Get the signal engine version
   */
  getEngineVersion(): string {
    return this.signalEngine.getEngineVersion();
  }
}
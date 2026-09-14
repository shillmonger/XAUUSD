/**
 * Internal Signal Intelligence Engine Service
 * Main entry point for the internal signal intelligence engine
 * Receives raw Telegram text, runs parsing/pattern recognition, produces structured result
 */

import { SignalEngine, SignalExtractionResult } from './ai-provider.interface';
import {
  extractSymbol,
  extractDirection,
  extractOrderType,
  extractEntry,
  extractEntryFromRange,
  extractStopLoss,
  extractTakeProfits,
  hasStrongTradingIndicators,
} from './signal-parser';
import {
  normalizeSymbol,
  normalizeDirection,
  normalizeOrderType,
  normalizePrice,
  normalizeTakeProfits,
} from './signal-normalizer';
import { safeValidateSignalExtraction } from './signal-schema';

const ENGINE_VERSION = 'v1';

export class InternalSignalEngine implements SignalEngine {
  /**
   * Extract trading signal from a Telegram message
   * @param messageText - The Telegram message text to analyze
   * @returns Promise with the extracted signal result
   */
  async extractSignal(messageText: string): Promise<SignalExtractionResult> {
    console.log(`[Signal Engine] Starting signal extraction for message: "${messageText.substring(0, 50)}..."`);

    try {
      // Step 1: Check if this has strong trading indicators
      if (!hasStrongTradingIndicators(messageText)) {
        console.log(`[Signal Engine] Message lacks strong trading indicators, rejecting`);
        return {
          isValidSignal: false,
        };
      }

      // Step 2: Extract symbol
      const rawSymbol = extractSymbol(messageText);
      const normalizedSymbol = normalizeSymbol(rawSymbol);
      
      if (!normalizedSymbol) {
        console.log(`[Signal Engine] No valid XAUUSD symbol found, rejecting`);
        return {
          isValidSignal: false,
        };
      }

      console.log(`[Signal Engine] Symbol extracted: ${normalizedSymbol}`);

      // Step 3: Extract direction
      const rawDirection = extractDirection(messageText);
      const normalizedDirection = normalizeDirection(rawDirection);
      
      if (!normalizedDirection) {
        console.log(`[Signal Engine] No valid direction found, rejecting`);
        return {
          isValidSignal: false,
          symbol: normalizedSymbol,
        };
      }

      console.log(`[Signal Engine] Direction extracted: ${normalizedDirection}`);

      // Step 4: Extract order type
      const rawOrderType = extractOrderType(messageText);
      const normalizedOrderType = normalizeOrderType(rawOrderType);
      
      if (!normalizedOrderType) {
        console.log(`[Signal Engine] No valid order type found, rejecting`);
        return {
          isValidSignal: false,
          symbol: normalizedSymbol,
          direction: normalizedDirection,
        };
      }

      console.log(`[Signal Engine] Order type extracted: ${normalizedOrderType}`);

      // Step 5: Extract entry (required for LIMIT/STOP, optional for MARKET)
      const rawEntry = extractEntry(messageText, normalizedOrderType);
      const normalizedEntry = rawEntry !== undefined ? normalizePrice(rawEntry) : undefined;
      
      console.log(`[Signal Engine] Raw entry extracted: ${rawEntry}, Normalized entry: ${normalizedEntry}`);
      
      if (normalizedOrderType !== 'MARKET' && normalizedEntry === null) {
        console.log(`[Signal Engine] LIMIT/STOP order requires entry price, rejecting`);
        return {
          isValidSignal: false,
          symbol: normalizedSymbol,
          direction: normalizedDirection,
          orderType: normalizedOrderType,
        };
      }

      console.log(`[Signal Engine] Entry extracted: ${normalizedEntry}`);

      // Step 6: Extract stop loss
      const rawStopLoss = extractStopLoss(messageText);
      const normalizedStopLoss = normalizePrice(rawStopLoss);
      
      if (normalizedStopLoss === undefined) {
        console.log(`[Signal Engine] No valid stop loss found, rejecting`);
        return {
          isValidSignal: false,
          symbol: normalizedSymbol,
          direction: normalizedDirection,
          orderType: normalizedOrderType,
          entry: normalizedEntry,
        };
      }

      console.log(`[Signal Engine] Stop loss extracted: ${normalizedStopLoss}`);

      // Step 7: Extract take profits
      const rawTakeProfits = extractTakeProfits(messageText);
      const normalizedTakeProfits = normalizeTakeProfits(rawTakeProfits);
      
      if (normalizedTakeProfits.length === 0) {
        console.log(`[Signal Engine] No valid take profits found, rejecting`);
        return {
          isValidSignal: false,
          symbol: normalizedSymbol,
          direction: normalizedDirection,
          orderType: normalizedOrderType,
          entry: normalizedEntry,
          stopLoss: normalizedStopLoss,
        };
      }

      console.log(`[Signal Engine] Take profits extracted: [${normalizedTakeProfits.join(', ')}]`);

      // Step 8: Basic price relationship validation during extraction
      // DISABLED: Signal provider may send non-standard formats
      // This catches obvious errors before the deterministic validator
      // Uncomment this section to enable strict price relationship validation
      /*
      if (normalizedOrderType !== 'MARKET' && normalizedEntry !== undefined) {
        // For BUY signals: SL should be below entry, TPs should be above entry
        if (normalizedDirection === 'BUY') {
          if (normalizedStopLoss >= normalizedEntry) {
            console.log(`[Signal Engine] BUY signal SL ${normalizedStopLoss} is above entry ${normalizedEntry}, rejecting`);
            return {
              isValidSignal: false,
              symbol: normalizedSymbol,
              direction: normalizedDirection,
              orderType: normalizedOrderType,
              entry: normalizedEntry,
              stopLoss: normalizedStopLoss,
            };
          }
          
          for (const tp of normalizedTakeProfits) {
            if (tp <= normalizedEntry) {
              console.log(`[Signal Engine] BUY signal TP ${tp} is below entry ${normalizedEntry}, rejecting`);
              return {
                isValidSignal: false,
                symbol: normalizedSymbol,
                direction: normalizedDirection,
                orderType: normalizedOrderType,
                entry: normalizedEntry,
                stopLoss: normalizedStopLoss,
                takeProfits: normalizedTakeProfits,
              };
            }
          }
        }
        
        // For SELL signals: SL should be above entry, TPs should be below entry
        if (normalizedDirection === 'SELL') {
          if (normalizedStopLoss <= normalizedEntry) {
            console.log(`[Signal Engine] SELL signal SL ${normalizedStopLoss} is below entry ${normalizedEntry}, rejecting`);
            return {
              isValidSignal: false,
              symbol: normalizedSymbol,
              direction: normalizedDirection,
              orderType: normalizedOrderType,
              entry: normalizedEntry,
              stopLoss: normalizedStopLoss,
            };
          }
          
          for (const tp of normalizedTakeProfits) {
            if (tp >= normalizedEntry) {
              console.log(`[Signal Engine] SELL signal TP ${tp} is above entry ${normalizedEntry}, rejecting`);
              return {
                isValidSignal: false,
                symbol: normalizedSymbol,
                direction: normalizedDirection,
                orderType: normalizedOrderType,
                entry: normalizedEntry,
                stopLoss: normalizedStopLoss,
                takeProfits: normalizedTakeProfits,
              };
            }
          }
        }
      }
      */

      // Step 9: Build the result
      const result: SignalExtractionResult = {
        isValidSignal: true,
        symbol: normalizedSymbol,
        direction: normalizedDirection,
        orderType: normalizedOrderType,
        entry: normalizedEntry, // Can be null for MARKET orders
        stopLoss: normalizedStopLoss,
        takeProfits: normalizedTakeProfits,
      };

      // Step 10: Validate against schema
      const validationResult = safeValidateSignalExtraction(result);
      
      if (!validationResult.success) {
        console.error(`[Signal Engine] Schema validation failed: ${validationResult.error}`);
        return {
          isValidSignal: false,
        };
      }

      console.log(`[Signal Engine] Signal extraction completed successfully`);
      console.log(`[Signal Engine] Result:`, JSON.stringify(result));

      return result;

    } catch (error) {
      console.error(`[Signal Engine] Signal extraction failed:`, error);
      return {
        isValidSignal: false,
      };
    }
  }

  /**
   * Get the engine name for logging/debugging
   */
  getEngineName(): string {
    return 'InternalSignalEngine';
  }

  /**
   * Get the engine version
   */
  getEngineVersion(): string {
    return ENGINE_VERSION;
  }
}

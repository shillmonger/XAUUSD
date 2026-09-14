/**
 * Deterministic Signal Validator
 * Validates extracted signals against trading rules
 * This is the actual Phase 4 validation - makes the final decision whether a signal is authorized
 */

import { SignalExtractionResult, SignalValidationResult } from './signal-schema';

/**
 * Validate a signal extraction result against deterministic trading rules
 */
export function validateSignal(extractionResult: SignalExtractionResult): SignalValidationResult {
  console.log(`[Signal Validator] Starting deterministic validation`);

  // Rule 1: Check if the extraction result is marked as valid
  if (!extractionResult.isValidSignal) {
    console.log(`[Signal Validator] Signal extraction marked as invalid`);
    return {
      isValid: false,
      reason: 'Signal extraction failed or incomplete',
    };
  }

  // Rule 2: Symbol must be XAUUSD
  if (extractionResult.symbol !== 'XAUUSD') {
    console.log(`[Signal Validator] Invalid symbol: ${extractionResult.symbol}`);
    return {
      isValid: false,
      reason: `Invalid symbol: ${extractionResult.symbol}. Only XAUUSD is supported.`,
    };
  }

  // Rule 3: Direction must be BUY or SELL
  if (!extractionResult.direction || !['BUY', 'SELL'].includes(extractionResult.direction)) {
    console.log(`[Signal Validator] Invalid direction: ${extractionResult.direction}`);
    return {
      isValid: false,
      reason: `Invalid direction: ${extractionResult.direction}. Must be BUY or SELL.`,
    };
  }

  // Rule 4: Order type must be MARKET, LIMIT, or STOP
  if (!extractionResult.orderType || !['MARKET', 'LIMIT', 'STOP'].includes(extractionResult.orderType)) {
    console.log(`[Signal Validator] Invalid order type: ${extractionResult.orderType}`);
    return {
      isValid: false,
      reason: `Invalid order type: ${extractionResult.orderType}. Must be MARKET, LIMIT, or STOP.`,
    };
  }

  // Rule 5: LIMIT and STOP orders require entry price
  if (extractionResult.orderType === 'LIMIT' || extractionResult.orderType === 'STOP') {
    if (extractionResult.entry === undefined) {
      console.log(`[Signal Validator] ${extractionResult.orderType} order missing entry price`);
      return {
        isValid: false,
        reason: `${extractionResult.orderType} order requires entry price.`,
      };
    }
  }

  // Rule 6: Stop loss must exist
  if (!extractionResult.stopLoss) {
    console.log(`[Signal Validator] Missing stop loss`);
    return {
      isValid: false,
      reason: 'Stop loss is required.',
    };
  }

  // Rule 7: At least one take profit must exist
  if (!extractionResult.takeProfits || extractionResult.takeProfits.length === 0) {
    console.log(`[Signal Validator] Missing take profits`);
    return {
      isValid: false,
      reason: 'At least one take profit is required.',
    };
  }

  // Rule 8: Validate price relationships for BUY signals
  // DISABLED: Signal provider may send non-standard formats
  // Uncomment this section to enable strict price relationship validation
  /*
  if (extractionResult.direction === 'BUY') {
    const referencePrice = extractionResult.entry ?? extractionResult.stopLoss;
    
    if (!referencePrice) {
      console.log(`[Signal Validator] BUY signal missing reference price for validation`);
      return {
        isValid: false,
        reason: 'BUY signal requires reference price for validation.',
      };
    }

    // SL should be below entry for BUY (only if entry is present)
    if (extractionResult.entry !== undefined && extractionResult.stopLoss >= extractionResult.entry) {
      console.log(`[Signal Validator] BUY signal SL is above entry`);
      return {
        isValid: false,
        reason: 'BUY signal stop loss must be below entry price.',
      };
    }

    // TPs should be above entry for BUY (only if entry is present)
    if (extractionResult.entry !== undefined) {
      for (const tp of extractionResult.takeProfits) {
        if (tp <= extractionResult.entry) {
          console.log(`[Signal Validator] BUY signal TP ${tp} is below entry`);
          return {
            isValid: false,
            reason: `BUY signal take profit ${tp} must be above entry price.`,
          };
        }
      }
    }
  }
  */

  // Rule 9: Validate price relationships for SELL signals
  // DISABLED: Signal provider may send non-standard formats
  // Uncomment this section to enable strict price relationship validation
  /*
  if (extractionResult.direction === 'SELL') {
    const referencePrice = extractionResult.entry ?? extractionResult.stopLoss;
    
    if (!referencePrice) {
      console.log(`[Signal Validator] SELL signal missing reference price for validation`);
      return {
        isValid: false,
        reason: 'SELL signal requires reference price for validation.',
      };
    }

    // SL should be above entry for SELL (only if entry is present)
    if (extractionResult.entry !== undefined && extractionResult.stopLoss <= extractionResult.entry) {
      console.log(`[Signal Validator] SELL signal SL is below entry`);
      return {
        isValid: false,
        reason: 'SELL signal stop loss must be above entry price.',
      };
    }

    // TPs should be below entry for SELL (only if entry is present)
    if (extractionResult.entry !== undefined) {
      for (const tp of extractionResult.takeProfits) {
        if (tp >= extractionResult.entry) {
          console.log(`[Signal Validator] SELL TP ${tp} is above entry`);
          return {
            isValid: false,
            reason: `SELL signal take profit ${tp} must be below entry price.`,
          };
        }
      }
    }
  }
  */

  // Rule 10: Validate numeric values
  if (extractionResult.entry !== undefined && (isNaN(extractionResult.entry) || !isFinite(extractionResult.entry))) {
    console.log(`[Signal Validator] Invalid entry price: ${extractionResult.entry}`);
    return {
      isValid: false,
      reason: 'Entry price is not a valid number.',
    };
  }

  if (isNaN(extractionResult.stopLoss) || !isFinite(extractionResult.stopLoss)) {
    console.log(`[Signal Validator] Invalid stop loss: ${extractionResult.stopLoss}`);
    return {
      isValid: false,
      reason: 'Stop loss is not a valid number.',
    };
  }

  for (const tp of extractionResult.takeProfits) {
    if (isNaN(tp) || !isFinite(tp)) {
      console.log(`[Signal Validator] Invalid take profit: ${tp}`);
      return {
        isValid: false,
        reason: `Take profit ${tp} is not a valid number.`,
      };
    }
  }

  // All validation rules passed
  console.log(`[Signal Validator] Signal validation passed`);
  return {
    isValid: true,
    validatedSignal: extractionResult,
  };
}
/**
 * Deterministic Signal Validator
 * Validates extracted signals against trading rules
 * Updated for Deriv Multipliers architecture with LIMIT rejection and directional SL/TP validation
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

  // Rule 2: Asset must be XAUUSD (renamed from symbol)
  if (extractionResult.asset !== 'XAUUSD') {
    console.log(`[Signal Validator] Invalid asset: ${extractionResult.asset}`);
    return {
      isValid: false,
      reason: `Invalid asset: ${extractionResult.asset}. Only XAUUSD is supported.`,
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

  // Rule 4: Source order type must be MARKET, LIMIT, or STOP (renamed from orderType)
  if (!extractionResult.sourceOrderType || !['MARKET', 'LIMIT', 'STOP'].includes(extractionResult.sourceOrderType)) {
    console.log(`[Signal Validator] Invalid source order type: ${extractionResult.sourceOrderType}`);
    return {
      isValid: false,
      reason: `Invalid source order type: ${extractionResult.sourceOrderType}. Must be MARKET, LIMIT, or STOP.`,
    };
  }

  // Rule 5: STOP orders require entry price (renamed fields)
  if (extractionResult.sourceOrderType === 'STOP') {
    if (extractionResult.sourceEntryPrice === undefined) {
      console.log(`[Signal Validator] STOP order missing entry price`);
      return {
        isValid: false,
        reason: `STOP order requires entry price.`,
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

  // Rule 8: DIRECTIONAL SL/TP VALIDATION (NEW - ENABLED)
  // This prevents logically inverted signals
  if (extractionResult.direction === 'BUY') {
    // BUY: SL should be below reference, TP should be above reference
    const referencePrice = extractionResult.sourceEntryPrice ?? extractionResult.stopLoss;
    
    if (!referencePrice) {
      console.log(`[Signal Validator] BUY signal missing reference price for directional validation`);
      return {
        isValid: false,
        reason: 'BUY signal requires reference price for directional validation.',
      };
    }

    // SL should be below reference for BUY
    if (extractionResult.stopLoss >= referencePrice) {
      console.log(`[Signal Validator] BUY signal SL is above reference`);
      return {
        isValid: false,
        reason: 'BUY signal stop loss must be below reference price.',
      };
    }

    // TPs should be above reference for BUY
    for (const tp of extractionResult.takeProfits) {
      if (tp <= referencePrice) {
        console.log(`[Signal Validator] BUY signal TP ${tp} is below reference`);
        return {
          isValid: false,
          reason: `BUY signal take profit ${tp} must be above reference price.`,
        };
      }
    }
  }

  if (extractionResult.direction === 'SELL') {
    // SELL: SL should be above reference, TP should be below reference
    const referencePrice = extractionResult.sourceEntryPrice ?? extractionResult.stopLoss;
    
    if (!referencePrice) {
      console.log(`[Signal Validator] SELL signal missing reference price for directional validation`);
      return {
        isValid: false,
        reason: 'SELL signal requires reference price for directional validation.',
      };
    }

    // SL should be above reference for SELL
    if (extractionResult.stopLoss <= referencePrice) {
      console.log(`[Signal Validator] SELL signal SL is below reference`);
      return {
        isValid: false,
        reason: 'SELL signal stop loss must be above reference price.',
      };
    }

    // TPs should be below reference for SELL
    for (const tp of extractionResult.takeProfits) {
      if (tp >= referencePrice) {
        console.log(`[Signal Validator] SELL signal TP ${tp} is above reference`);
        return {
          isValid: false,
          reason: `SELL signal take profit ${tp} must be below reference price.`,
        };
      }
    }
  }

  // Rule 9: Validate numeric values (renamed field)
  if (extractionResult.sourceEntryPrice !== undefined && (isNaN(extractionResult.sourceEntryPrice) || !isFinite(extractionResult.sourceEntryPrice))) {
    console.log(`[Signal Validator] Invalid source entry price: ${extractionResult.sourceEntryPrice}`);
    return {
      isValid: false,
      reason: 'Source entry price is not a valid number.',
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
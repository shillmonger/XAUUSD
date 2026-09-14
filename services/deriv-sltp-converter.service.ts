/**
 * Deriv SL/TP Converter Service
 * Converts price-based stop loss/take profit to monetary amounts for Multipliers
 * 
 * CRITICAL: This uses a CANDIDATE formula that requires DEMO VALIDATION before production use
 * The conversion is based on Deriv documentation: P/L = Stake × Multiplier × % price move
 * However, the exact behavior must be validated against actual Deriv demo contracts
 */

export interface SLTPConversionResult {
  stopLossAmount: number;
  takeProfitAmount: number;
  conversionMethod: string;
  validationStatus: 'CANDIDATE' | 'DEMO_VALIDATED' | 'PRODUCTION_READY';
  requiresDemoValidation: boolean;
  conversionDetails: {
    referenceSpot: number;
    actualEntrySpot?: number;
    stopLossDistance: number;
    takeProfitDistance: number;
    stopLossPercent: number;
    takeProfitPercent: number;
    stake: number;
    multiplier: number;
  };
}

export interface PriceLevelSignal {
  stopLoss: number;
  takeProfit: number;
}

/**
 * Convert price-based SL/TP to monetary amounts using CANDIDATE formula
 * 
 * CANDIDATE FORMULA: 
 * - P/L = Stake × Multiplier × % price move
 * - stopLossAmount = stake × multiplier × (stopLossDistance / referenceSpot / 100)
 * - takeProfitAmount = stake × multiplier × (takeProfitDistance / referenceSpot / 100)
 * 
 * WARNING: This formula MUST be validated against actual Deriv demo contracts
 * before being used in production. The values may represent different semantics
 * (monetary amounts vs price levels) depending on the actual contract behavior.
 * 
 * @param signal - Signal with price-based SL/TP
 * @param referenceSpot - Reference spot price (from ticks or proposal)
 * @param stake - Stake amount
 * @param multiplier - Multiplier value
 * @returns Conversion result with validation status
 */
export function convertPriceLevelsToCurrencyAmounts(
  signal: PriceLevelSignal,
  referenceSpot: number,
  stake: number,
  multiplier: number
): SLTPConversionResult {
  const { stopLoss, takeProfit } = signal;
  
  // Calculate price distances
  const stopLossDistance = Math.abs(stopLoss - referenceSpot);
  const takeProfitDistance = Math.abs(takeProfit - referenceSpot);
  
  // Calculate percentage moves
  const stopLossPercent = (stopLossDistance / referenceSpot) * 100;
  const takeProfitPercent = (takeProfitDistance / referenceSpot) * 100;
  
  // CANDIDATE CONVERSION FORMULA - REQUIRES DEMO VALIDATION
  // Based on Deriv documentation: P/L = Stake × Multiplier × % price move
  const stopLossAmount = stake * multiplier * (stopLossPercent / 100);
  const takeProfitAmount = stake * multiplier * (takeProfitPercent / 100);
  
  console.log('[SLTP Converter] CANDIDATE conversion performed:', {
    referenceSpot,
    stopLoss,
    takeProfit,
    stopLossDistance,
    takeProfitDistance,
    stopLossPercent,
    takeProfitPercent,
    stake,
    multiplier,
    stopLossAmount,
    takeProfitAmount,
    warning: 'THIS IS A CANDIDATE FORMULA - REQUIRES DEMO VALIDATION'
  });
  
  return {
    stopLossAmount: Math.round(stopLossAmount * 100) / 100,
    takeProfitAmount: Math.round(takeProfitAmount * 100) / 100,
    conversionMethod: 'CANDIDATE: stake * multiplier * percentage_move',
    validationStatus: 'CANDIDATE',
    requiresDemoValidation: true,
    conversionDetails: {
      referenceSpot,
      stopLossDistance,
      takeProfitDistance,
      stopLossPercent,
      takeProfitPercent,
      stake,
      multiplier
    }
  };
}

/**
 * Validate converted SL/TP amounts against Deriv constraints
 * 
 * @param stopLossAmount - Converted stop loss amount
 * @param takeProfitAmount - Converted take profit amount
 * @param stake - Stake amount
 * @param minStake - Minimum stake from contracts_for
 * @param maxStake - Maximum stake from contracts_for
 * @returns Validation result
 */
export function validateConvertedAmounts(
  stopLossAmount: number,
  takeProfitAmount: number,
  stake: number,
  minStake: number,
  maxStake: number
): {
  valid: boolean;
  reason?: string;
} {
  // Stop loss must be less than stake (cannot lose more than stake)
  if (stopLossAmount >= stake) {
    return {
      valid: false,
      reason: `Stop loss amount (${stopLossAmount}) must be less than stake (${stake})`
    };
  }
  
  // Take profit must be positive
  if (takeProfitAmount <= 0) {
    return {
      valid: false,
      reason: `Take profit amount (${takeProfitAmount}) must be positive`
    };
  }
  
  // Validate against stake constraints
  if (stake < minStake) {
    return {
      valid: false,
      reason: `Stake (${stake}) below minimum (${minStake})`
    };
  }
  
  if (stake > maxStake) {
    return {
      valid: false,
      reason: `Stake (${stake}) above maximum (${maxStake})`
    };
  }
  
  return { valid: true };
}

/**
 * Recalculate SL/TP amounts after obtaining actual entry spot
 * This adjusts the conversion based on the actual execution price vs reference price
 * 
 * @param signal - Signal with price-based SL/TP
 * @param actualEntrySpot - Actual entry spot from proposal_open_contract
 * @param stake - Stake amount
 * @param multiplier - Multiplier value
 * @returns Adjusted conversion result
 */
export function recalculateWithActualEntry(
  signal: PriceLevelSignal,
  actualEntrySpot: number,
  stake: number,
  multiplier: number
): SLTPConversionResult {
  const result = convertPriceLevelsToCurrencyAmounts(signal, actualEntrySpot, stake, multiplier);
  
  // Update with actual entry spot
  result.conversionDetails.actualEntrySpot = actualEntrySpot;
  
  console.log('[SLTP Converter] Recalculated with actual entry spot:', {
    actualEntrySpot,
    adjustedStopLossAmount: result.stopLossAmount,
    adjustedTakeProfitAmount: result.takeProfitAmount
  });
  
  return result;
}

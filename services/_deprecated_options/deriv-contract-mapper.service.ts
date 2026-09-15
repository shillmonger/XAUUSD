/**
 * DEPRECATED: Deriv Contract Mapper Service
 * 
 * This service is DEPRECATED and should NOT be used for MT5/CFD trading.
 * It was designed for Deriv Options/Multipliers contract type mapping only.
 * 
 * For MT5/CFD trading, contract types are standard BUY/SELL operations.
 * No contract type mapping is needed for MT5.
 * 
 * This file is kept for historical reference only.
 * The active trading path now uses MT5/CFD architecture.
 */

export interface ContractMappingResult {
  contractType: string;
  direction: 'BUY' | 'SELL';
}

/**
 * Map BUY/SELL direction to Deriv Multiplier contract types
 * 
 * ENFORCED MAPPING:
 * - BUY → MULTUP
 * - SELL → MULTDOWN
 * 
 * AI must NEVER produce these contract types
 * Backend determines these based on trading intent
 * 
 * @param direction - Trading direction
 * @returns Contract type mapping
 */
export function mapDirectionToContractType(direction: 'BUY' | 'SELL'): ContractMappingResult {
  const mapping: Record<'BUY' | 'SELL', string> = {
    'BUY': 'MULTUP',
    'SELL': 'MULTDOWN'
  };
  
  const contractType = mapping[direction];
  
  if (!contractType) {
    throw new Error(`Invalid direction: ${direction}. Must be BUY or SELL.`);
  }
  
  console.log('[Contract Mapper] Direction mapped:', {
    direction,
    contractType
  });
  
  return {
    contractType,
    direction
  };
}

/**
 * Validate that AI output does not contain Deriv-specific fields
 * This prevents the AI from generating contract-specific data
 * 
 * @param aiSignal - AI-generated signal
 * @returns Validation result
 */
export function validateAIOutput(aiSignal: any): {
  valid: boolean;
  reason?: string;
} {
  const forbiddenFields = [
    'contractType',
    'MULTUP',
    'MULTDOWN',
    'CALL',
    'PUT',
    'multiplier',
    'currency',
    'underlying_symbol',
    'derivSymbol',
    'proposal',
    'duration',
    'duration_unit'
  ];
  
  const detectedFields: string[] = [];
  
  for (const field of forbiddenFields) {
    if (field in aiSignal) {
      detectedFields.push(field);
    }
  }
  
  if (detectedFields.length > 0) {
    return {
      valid: false,
      reason: `AI must not produce Deriv-specific fields: ${detectedFields.join(', ')}`
    };
  }
  
  return { valid: true };
}

/**
 * Signal Training Examples
 * Contains representative valid/invalid examples used to test and improve the internal signal engine
 * These examples serve as regression tests and pattern coverage for the engine
 */

import { SignalExtractionResult } from './signal-schema';

export interface TrainingExample {
  input: string;
  expected: {
    isValidSignal: boolean;
    asset?: string;
    direction?: 'BUY' | 'SELL';
    sourceOrderType?: 'MARKET' | 'LIMIT' | 'STOP';
    sourceEntryPrice?: number;
    stopLoss?: number;
    takeProfits?: number[];
  };
  description: string;
}

/**
 * Training examples for the internal signal intelligence engine
 */
export const TRAINING_EXAMPLES: TrainingExample[] = [
  // Valid complete signals
  {
    input: "GOLD Buy Limit 4088\nTP 4091\nTP 4100\nTP 4120\nSL 4078",
    expected: {
      isValidSignal: true,
      asset: "XAUUSD",
      direction: "BUY",
      sourceOrderType: "LIMIT",
      sourceEntryPrice: 4088,
      stopLoss: 4078,
      takeProfits: [4091, 4100, 4120]
    },
    description: "Complete GOLD BUY LIMIT signal with multiple TPs"
  },
  {
    input: "XAUUSD BUY NOW\nSL 4070\nTP 4090",
    expected: {
      isValidSignal: true,
      asset: "XAUUSD",
      direction: "BUY",
      sourceOrderType: "MARKET",
      sourceEntryPrice: undefined,
      stopLoss: 4070,
      takeProfits: [4090]
    },
    description: "XAUUSD BUY NOW (MARKET) signal"
  },
  {
    input: "GOLD SELL LIMIT 4105\nSL 4120\nTP1 4095\nTP2 4085",
    expected: {
      isValidSignal: true,
      asset: "XAUUSD",
      direction: "SELL",
      sourceOrderType: "LIMIT",
      sourceEntryPrice: 4105,
      stopLoss: 4120,
      takeProfits: [4085, 4095]
    },
    description: "GOLD SELL LIMIT signal with numbered TPs"
  },
  {
    input: "XAUUSD BUY STOP 4090\nSL 4078\nTP 4100\nTP 4110",
    expected: {
      isValidSignal: true,
      asset: "XAUUSD",
      direction: "BUY",
      sourceOrderType: "STOP",
      sourceEntryPrice: 4090,
      stopLoss: 4078,
      takeProfits: [4100, 4110]
    },
    description: "XAUUSD BUY STOP signal"
  },
  {
    input: "XAUUSD SELL NOW\nENTRY 4050\nTP 4045\nSL 4060",
    expected: {
      isValidSignal: true,
      asset: "XAUUSD",
      direction: "SELL",
      sourceOrderType: "MARKET",
      sourceEntryPrice: 4050,
      stopLoss: 4060,
      takeProfits: [4045]
    },
    description: "XAUUSD SELL NOW with explicit entry"
  },
  
  // Valid signals with minimal info
  {
    input: "GOLD BUY LIMIT 4088\nTP 4091\nSL 4078",
    expected: {
      isValidSignal: true,
      asset: "XAUUSD",
      direction: "BUY",
      sourceOrderType: "LIMIT",
      sourceEntryPrice: 4088,
      stopLoss: 4078,
      takeProfits: [4091]
    },
    description: "Valid signal with single TP"
  },
  
  // Invalid/non-signal examples
  {
    input: "HI",
    expected: {
      isValidSignal: false
    },
    description: "Simple greeting - not a signal"
  },
  {
    input: "Good morning everyone",
    expected: {
      isValidSignal: false
    },
    description: "Morning greeting - not a signal"
  },
  {
    input: "Gold is moving",
    expected: {
      isValidSignal: false
    },
    description: "Gold movement commentary - not a signal"
  },
  {
    input: "Gold bullish today",
    expected: {
      isValidSignal: false
    },
    description: "Gold sentiment commentary - not a signal"
  },
  {
    input: "Watch gold",
    expected: {
      isValidSignal: false
    },
    description: "Watch instruction - not a signal"
  },
  {
    input: "XAUUSD analysis",
    expected: {
      isValidSignal: false
    },
    description: "Analysis mention - not a signal"
  },
  {
    input: "BUY",
    expected: {
      isValidSignal: false
    },
    description: "Just BUY direction - incomplete signal"
  },
  {
    input: "SELL",
    expected: {
      isValidSignal: false
    },
    description: "Just SELL direction - incomplete signal"
  },
  {
    input: "TP 4090",
    expected: {
      isValidSignal: false
    },
    description: "Just TP - incomplete signal"
  },
  {
    input: "SL 4070",
    expected: {
      isValidSignal: false
    },
    description: "Just SL - incomplete signal"
  },
  {
    input: "Gold could reach 4100",
    expected: {
      isValidSignal: false
    },
    description: "Gold prediction - not a signal"
  },
  
  // Unsupported symbols
  {
    input: "EURUSD BUY NOW\nENTRY 1.0850\nTP 1.0900\nSL 1.0800",
    expected: {
      isValidSignal: false
    },
    description: "EURUSD signal - unsupported symbol"
  },
  {
    input: "BTCUSD SELL\nENTRY 65000\nTP 64000\nSL 66000",
    expected: {
      isValidSignal: false
    },
    description: "BTCUSD signal - unsupported symbol"
  },
  
  // Incomplete signals
  {
    input: "GOLD BUY LIMIT",
    expected: {
      isValidSignal: false
    },
    description: "Missing entry price"
  },
  {
    input: "GOLD BUY LIMIT 4088",
    expected: {
      isValidSignal: false
    },
    description: "Missing SL and TP"
  },
  {
    input: "GOLD BUY LIMIT 4088\nTP 4091",
    expected: {
      isValidSignal: false
    },
    description: "Missing SL"
  },
  {
    input: "GOLD BUY LIMIT 4088\nSL 4078",
    expected: {
      isValidSignal: false
    },
    description: "Missing TP"
  },
  
  // Different capitalization
  {
    input: "gold buy limit 4088\ntp 4091\ntp 4100\nsl 4078",
    expected: {
      isValidSignal: true,
      asset: "XAUUSD",
      direction: "BUY",
      sourceOrderType: "LIMIT",
      sourceEntryPrice: 4088,
      stopLoss: 4078,
      takeProfits: [4091, 4100]
    },
    description: "Lowercase signal - should normalize"
  },
  
  // Different spacing
  {
    input: "GOLD  Buy  Limit  4088  TP  4091  SL  4078",
    expected: {
      isValidSignal: true,
      asset: "XAUUSD",
      direction: "BUY",
      sourceOrderType: "LIMIT",
      sourceEntryPrice: 4088,
      stopLoss: 4078,
      takeProfits: [4091]
    },
    description: "Extra spacing - should handle"
  },
  
  // Different punctuation
  {
    input: "GOLD Buy Limit 4088, TP 4091, TP 4100, SL 4078",
    expected: {
      isValidSignal: true,
      asset: "XAUUSD",
      direction: "BUY",
      sourceOrderType: "LIMIT",
      sourceEntryPrice: 4088,
      stopLoss: 4078,
      takeProfits: [4091, 4100]
    },
    description: "Comma-separated - should handle"
  },
];

/**
 * Get examples by category
 */
export function getValidExamples(): TrainingExample[] {
  return TRAINING_EXAMPLES.filter(ex => ex.expected.isValidSignal);
}

export function getInvalidExamples(): TrainingExample[] {
  return TRAINING_EXAMPLES.filter(ex => !ex.expected.isValidSignal);
}

export function getSymbolExamples(): TrainingExample[] {
  return TRAINING_EXAMPLES.filter(ex => ex.input.includes('XAUUSD') || ex.input.includes('GOLD'));
}

export function getOrderTypeExamples(): TrainingExample[] {
  return TRAINING_EXAMPLES.filter(ex => ex.expected.sourceOrderType);
}

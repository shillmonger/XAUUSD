/**
 * Signal Patterns
 * Contains supported signal language/patterns for the internal signal intelligence engine
 */

/**
 * Supported symbol references for XAUUSD
 */
export const SYMBOL_PATTERNS = [
  'XAUUSD',
  'XAU/USD',
  'GOLD',
  'Gold',
  'gold',
  'XAU',
];

/**
 * Direction patterns
 */
export const DIRECTION_PATTERNS = {
  BUY: [
    'BUY',
    'BUY NOW',
    'LONG',
  ],
  SELL: [
    'SELL',
    'SELL NOW',
    'SHORT',
  ],
};

/**
 * Order type patterns
 */
export const ORDER_TYPE_PATTERNS = {
  MARKET: [
    'BUY NOW',
    'SELL NOW',
  ],
  LIMIT: [
    'BUY LIMIT',
    'SELL LIMIT',
  ],
  STOP: [
    'BUY STOP',
    'SELL STOP',
  ],
};

/**
 * Entry price patterns
 */
export const ENTRY_PATTERNS = [
  'ENTRY',
  'Entry:',
  'ENTRY PRICE',
  'ENTRY PRICE:',
  'BUY LIMIT',
  'SELL LIMIT',
  'BUY STOP',
  'SELL STOP',
  'BUY @',
  'SELL @',
  'BUY',
  'SELL',
];

/**
 * Stop loss patterns
 */
export const STOP_LOSS_PATTERNS = [
  'SL',
  'SL:',
  'STOP LOSS',
  'STOPLOSS',
  'S/L',
];

/**
 * Take profit patterns
 */
export const TAKE_PROFIT_PATTERNS = [
  'TP',
  'TP:',
  'TP1',
  'TP2',
  'TP3',
  'TAKE PROFIT',
  'TAKE PROFIT:',
  'TAKE PROFITS:',
];

/**
 * Check if text contains any of the patterns (case-insensitive)
 */
export function containsPattern(text: string, patterns: string[]): boolean {
  // Normalize multiple spaces to single space for better pattern matching
  const normalizedText = text.replace(/\s+/g, ' ');
  const upperText = normalizedText.toUpperCase();
  return patterns.some(pattern => upperText.includes(pattern.toUpperCase()));
}

/**
 * Find which pattern matches in text (case-insensitive)
 */
export function findMatchingPattern(text: string, patterns: string[]): string | null {
  // Normalize multiple spaces to single space for better pattern matching
  const normalizedText = text.replace(/\s+/g, ' ');
  const upperText = normalizedText.toUpperCase();
  for (const pattern of patterns) {
    if (upperText.includes(pattern.toUpperCase())) {
      return pattern;
    }
  }
  return null;
}

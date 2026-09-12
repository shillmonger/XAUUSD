/**
 * Signal Patterns
 * Contains supported signal language/patterns for the internal signal intelligence engine
 */

/**
 * Supported symbol references for XAUUSD
 */
export const SYMBOL_PATTERNS = [
  'XAUUSD',
  '#XAUUSD',
  'XAU/USD',
  'XAU-USD',
  'GOLD',
  'Gold',
  'gold',
  'XAU',
  'xau',
  'Xau',
  '#GOLD',
  '#Gold',
  '#gold',
  '#XAU',
  '#xau',
  '#Xau',
];

/**
 * Direction patterns
 */
export const DIRECTION_PATTERNS = {
  BUY: [
    'BUY',
    'BUY NOW',
    'LONG',
    'BUY-',
    'BUY @',
    'BUY@',
    'BUY LIMIT',
    'BUY STOP',
    'BUY MARKET',
    'B',
    'Buy',
    'buy',
    'ENTRY BUY',
    'ENTER BUY',
    'OPEN BUY',
    'POSITION BUY',
    'GO LONG',
    '📈',
    '🟢',
    '✅',
  ],
  SELL: [
    'SELL',
    'SELL NOW',
    'SHORT',
    'SELL-',
    'SELL @',
    'SELL@',
    'SELL LIMIT',
    'SELL STOP',
    'SELL MARKET',
    'S',
    'Sell',
    'sell',
    'ENTRY SELL',
    'ENTER SELL',
    'OPEN SELL',
    'POSITION SELL',
    'GO SHORT',
    '📉',
    '🔴',
    '❌',
  ],
};

/**
 * Order type patterns
 */
export const ORDER_TYPE_PATTERNS = {
  MARKET: [
    'BUY NOW',
    'SELL NOW',
    'MARKET',
    'MKT',
    'AT MARKET',
    'FILL',
    'EXECUTE',
    'INSTANT',
  ],
  LIMIT: [
    'BUY LIMIT',
    'SELL LIMIT',
    'LIMIT',
    'LMT',
    'LIMIT ORDER',
    'PENDING LIMIT',
    'BUY @',
    'SELL @',
    'BUY@',
    'SELL@',
  ],
  STOP: [
    'BUY STOP',
    'SELL STOP',
    'STOP',
    'STP',
    'STOP ORDER',
    'PENDING STOP',
    'STOP ENTRY',
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
  'BUY@',
  'SELL@',
  'BUY-',
  'SELL-',
  'BUY',
  'SELL',
  'ENTER',
  'ENTER AT',
  'ENTER @',
  'PRICE',
  'PRICE:',
  'OPEN',
  'OPEN AT',
  'LEVEL',
  'LEVEL:',
  'AT',
  'AT:',
  'FROM',
  'FROM:',
  'START',
  'START:',
  'AREA',
  'AREA:',
  'ZONE',
  'ZONE:',
  'ENTRY ZONE',
  'ENTRY AREA',
  'OPEN PRICE',
  'OPEN PRICE:',
  'ORDER PRICE',
  'ORDER PRICE:',
  'EXECUTE AT',
  'EXECUTE @',
  'FILL AT',
  'FILL @',
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
  'STOP',
  'STOP:',
  'LOSS',
  'PROTECTION',
  'SAFETY',
  'STOP-LOSS',
  'STOP_LOSS',
  'STOP L',
  'STOP L:',
  'SL-',
  'SL-',
  'S.L',
  'S.L:',
  'CUT LOSS',
  'CUT LOSS:',
  'EXIT',
  'EXIT:',
  'EXIT PRICE',
  'EXIT PRICE:',
  'CLOSE',
  'CLOSE:',
  'CLOSE AT',
  'CLOSE @',
  'MAX LOSS',
  'MAX LOSS:',
  'RISK',
  'RISK:',
  'STOP LEVEL',
  'STOP LEVEL:',
  'SAFETY STOP',
  'SAFETY STOP:',
  'PROTECTION STOP',
  'PROTECTION STOP:',
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
  'TP4',
  'TP5',
  'TP6',
  'TP7',
  'TP8',
  'TP9',
  'TP10',
  'TAKE PROFIT',
  'TAKE PROFIT:',
  'TAKE PROFITS:',
  'TARGET',
  'TARGET:',
  'TARGETS',
  'TARGETS:',
  'TGT',
  'TGT:',
  'TGT1',
  'TGT2',
  'TGT3',
  'TGT4',
  'TGT5',
  'TGT6',
  'TGT7',
  'TGT8',
  'TGT9',
  'TGT10',
  'PROFIT',
  'PROFIT:',
  'PROFITS',
  'PROFITS:',
  'PROFIT TARGET',
  'PROFIT TARGET:',
  'PROFIT TARGETS',
  'PROFIT TARGETS:',
  'TAKE',
  'TAKE:',
  'EXIT AT',
  'EXIT @',
  'CLOSE AT',
  'CLOSE @',
  'SELL AT',
  'SELL @',
  'BUY AT',
  'BUY @',
  'P1',
  'P2',
  'P3',
  'P4',
  'P5',
  'P6',
  'P7',
  'P8',
  'P9',
  'P10',
  'P1:',
  'P2:',
  'P3:',
  'P4:',
  'P5:',
  'P6:',
  'P7:',
  'P8:',
  'P9:',
  'P10:',
  'PRICE TARGET',
  'PRICE TARGET:',
  'PRICE TARGETS',
  'PRICE TARGETS:',
  'TP-',
  'TP-1',
  'TP-2',
  'TP-3',
  'TP-4',
  'TP-5',
  'TGT-',
  'TGT-1',
  'TGT-2',
  'TGT-3',
  'TGT-4',
  'TGT-5',
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

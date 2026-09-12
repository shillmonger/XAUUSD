/**
 * Signal Parser
 * Extracts trading signal fields from text using pattern matching
 */

import {
  SYMBOL_PATTERNS,
  DIRECTION_PATTERNS,
  ORDER_TYPE_PATTERNS,
  ENTRY_PATTERNS,
  STOP_LOSS_PATTERNS,
  TAKE_PROFIT_PATTERNS,
  containsPattern,
  findMatchingPattern,
} from './signal-patterns';

/**
 * Extract symbol from text
 */
export function extractSymbol(text: string): string | null {
  // Normalize multiple spaces to single space for better pattern matching
  const normalizedText = text.replace(/\s+/g, ' ');
  const upperText = normalizedText.toUpperCase();
  
  // Check for XAUUSD or XAU/USD first (most specific)
  if (upperText.includes('XAUUSD') || upperText.includes('XAU/USD')) {
    return 'XAUUSD';
  }
  
  // Check for GOLD/Gold/gold
  if (upperText.includes('GOLD') || upperText.includes('XAU')) {
    return 'XAUUSD';
  }
  
  return null;
}

/**
 * Extract direction from text
 */
export function extractDirection(text: string): 'BUY' | 'SELL' | null {
  // Normalize multiple spaces to single space for better pattern matching
  const normalizedText = text.replace(/\s+/g, ' ');
  const upperText = normalizedText.toUpperCase();
  
  // Check BUY patterns
  for (const pattern of DIRECTION_PATTERNS.BUY) {
    if (upperText.includes(pattern.toUpperCase())) {
      return 'BUY';
    }
  }
  
  // Check SELL patterns
  for (const pattern of DIRECTION_PATTERNS.SELL) {
    if (upperText.includes(pattern.toUpperCase())) {
      return 'SELL';
    }
  }
  
  return null;
}

/**
 * Extract order type from text
 */
export function extractOrderType(text: string): 'MARKET' | 'LIMIT' | 'STOP' | null {
  // Normalize multiple spaces to single space for better pattern matching
  const normalizedText = text.replace(/\s+/g, ' ');
  const upperText = normalizedText.toUpperCase();
  
  // Check MARKET patterns
  for (const pattern of ORDER_TYPE_PATTERNS.MARKET) {
    if (upperText.includes(pattern.toUpperCase())) {
      return 'MARKET';
    }
  }
  
  // Check LIMIT patterns
  for (const pattern of ORDER_TYPE_PATTERNS.LIMIT) {
    if (upperText.includes(pattern.toUpperCase())) {
      return 'LIMIT';
    }
  }
  
  // Check STOP patterns
  for (const pattern of ORDER_TYPE_PATTERNS.STOP) {
    if (upperText.includes(pattern.toUpperCase())) {
      return 'STOP';
    }
  }
  
  return null;
}

/**
 * Extract numeric value from text following a pattern
 * Supports various number formats including decimals
 */
export function extractNumberAfterPattern(text: string, pattern: string): number | null {
  // Normalize multiple spaces to single space for better pattern matching
  const normalizedText = text.replace(/\s+/g, ' ');
  const upperText = normalizedText.toUpperCase();
  const upperPattern = pattern.toUpperCase();
  
  const patternIndex = upperText.indexOf(upperPattern);
  if (patternIndex === -1) {
    return null;
  }
  
  // Look for number after the pattern
  const afterPattern = normalizedText.substring(patternIndex + pattern.length);
  
  // Use regex to find the first number (supports decimals)
  const numberMatch = afterPattern.match(/-?\d+\.?\d*/);
  if (!numberMatch) {
    return null;
  }
  
  const number = parseFloat(numberMatch[0]);
  if (isNaN(number)) {
    return null;
  }
  
  return number;
}

/**
 * Extract entry price from text
 * For MARKET orders, we should not extract entry (it will be determined at execution)
 */
export function extractEntry(text: string, orderType?: 'MARKET' | 'LIMIT' | 'STOP'): number | undefined {
  // For MARKET orders, don't extract entry
  if (orderType === 'MARKET') {
    return undefined;
  }
  
  // Normalize multiple spaces to single space for better pattern matching
  const normalizedText = text.replace(/\s+/g, ' ');
  const upperText = normalizedText.toUpperCase();
  
  // First check if this is a MARKET order type
  if (upperText.includes('BUY NOW') || upperText.includes('SELL NOW')) {
    return undefined;
  }
  
  // Try other entry patterns
  for (const pattern of ENTRY_PATTERNS) {
    // Skip patterns that indicate MARKET orders
    if (pattern === 'BUY NOW' || pattern === 'SELL NOW') {
      continue;
    }
    
    const entry = extractNumberAfterPattern(normalizedText, pattern);
    if (entry !== null) {
      return entry;
    }
  }
  
  return undefined;
}

/**
 * Extract stop loss from text
 */
export function extractStopLoss(text: string): number | null {
  // Normalize multiple spaces to single space for better pattern matching
  const normalizedText = text.replace(/\s+/g, ' ');
  
  // Try each stop loss pattern
  for (const pattern of STOP_LOSS_PATTERNS) {
    const sl = extractNumberAfterPattern(normalizedText, pattern);
    if (sl !== null) {
      return sl;
    }
  }
  
  return null;
}

/**
 * Extract all take profit levels from text
 * Uses regex to find all occurrences of TP patterns with numbers
 */
export function extractTakeProfits(text: string): number[] {
  const takeProfits: number[] = [];
  const upperText = text.toUpperCase();
  
  // Normalize multiple spaces to single space for better pattern matching
  const normalizedText = upperText.replace(/\s+/g, ' ');
  
  // Regex to find TP patterns followed by numbers
  // Matches: TP 4091, TP1 4095, TP2 4085, TAKE PROFIT 4091, etc.
  // Also handles TP1:, TP2:, etc.
  const tpRegex = /(?:TP\d*|TAKE\s+PROFIT)[:\s]*(-?\d+\.?\d*)/gi;
  
  let match;
  while ((match = tpRegex.exec(normalizedText)) !== null) {
    const numberStr = match[1];
    const number = parseFloat(numberStr);
    
    if (!isNaN(number) && number > 0 && !takeProfits.includes(number)) {
      takeProfits.push(number);
    }
  }
  
  // Sort take profits in ascending order
  takeProfits.sort((a, b) => a - b);
  
  return takeProfits;
}

/**
 * Check if text has strong trading signal indicators
 * This helps distinguish between trading signals and market commentary
 */
export function hasStrongTradingIndicators(text: string): boolean {
  // Normalize multiple spaces to single space for better pattern matching
  const normalizedText = text.replace(/\s+/g, ' ');
  const upperText = normalizedText.toUpperCase();
  
  const strongIndicators = [
    'BUY NOW',
    'SELL NOW',
    'BUY LIMIT',
    'SELL LIMIT',
    'BUY STOP',
    'SELL STOP',
    'ENTRY',
    'TP1',
    'TP2',
    'TP3',
    'STOP LOSS',
    'TAKE PROFIT',
  ];
  
  for (const indicator of strongIndicators) {
    if (upperText.includes(indicator)) {
      return true;
    }
  }
  
  return false;
}

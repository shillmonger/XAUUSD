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
  if (upperText.includes('XAUUSD') || upperText.includes('XAU/USD') || upperText.includes('XAU-USD')) {
    return 'XAUUSD';
  }
  
  // Check for #XAUUSD (hashtag format)
  if (upperText.includes('#XAUUSD')) {
    return 'XAUUSD';
  }
  
  // Check for GOLD/Gold/gold (including hashtag variants)
  if (upperText.includes('GOLD') || upperText.includes('#GOLD')) {
    return 'XAUUSD';
  }
  
  // Check for XAU/Xau/xau (including hashtag variants)
  if (upperText.includes('XAU') || upperText.includes('#XAU')) {
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
  
  // Check for compact format: "BUY-4050-4055" or "SELL-4050-4055"
  const buyDashPattern = /BUY-\d+/i;
  const sellDashPattern = /SELL-\d+/i;
  
  if (buyDashPattern.test(upperText)) {
    return 'BUY';
  }
  
  if (sellDashPattern.test(upperText)) {
    return 'SELL';
  }
  
  // Check BUY patterns (check single letters first to avoid conflicts)
  if (upperText.includes('B') && !upperText.includes('BUY')) {
    // Check if it's part of a word or standalone
    const bIndex = upperText.indexOf('B');
    const beforeB = bIndex > 0 ? upperText[bIndex - 1] : ' ';
    const afterB = bIndex < upperText.length - 1 ? upperText[bIndex + 1] : ' ';
    
    // If B is surrounded by non-letters or is at start/end, treat as BUY
    if (beforeB === ' ' && afterB === ' ') {
      return 'BUY';
    }
  }
  
  if (upperText.includes('S') && !upperText.includes('SELL') && !upperText.includes('STOP')) {
    const sIndex = upperText.indexOf('S');
    const beforeS = sIndex > 0 ? upperText[sIndex - 1] : ' ';
    const afterS = sIndex < upperText.length - 1 ? upperText[sIndex + 1] : ' ';
    
    if (beforeS === ' ' && afterS === ' ') {
      return 'SELL';
    }
  }
  
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
  
  // Check for @ notation first (BUY @ or SELL @) - this indicates LIMIT order
  if (upperText.includes('BUY @') || upperText.includes('SELL @') || 
      upperText.includes('BUY@') || upperText.includes('SELL@')) {
    return 'LIMIT';
  }
  
  // Check for colon notation with range: "BUY:4050-4055" or "SELL:4060-4065"
  if (/BUY:\d+-\d+/i.test(upperText) || /SELL:\d+-\d+/i.test(upperText)) {
    return 'LIMIT';
  }
  
  // Check for ENTRY keyword - this indicates LIMIT order with explicit entry
  if (upperText.includes('ENTRY') || upperText.includes('ENTRY:')) {
    return 'LIMIT';
  }
  
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
  
  // Check for compact format with range: "BUY-4050-4055" or "SELL-4050-4055"
  // This indicates a LIMIT order at the first price
  if (/BUY-\d+-\d+/i.test(upperText) || /SELL-\d+-\d+/i.test(upperText)) {
    return 'LIMIT';
  }
  
  // Check for compact format with single price: "BUY 4050" or "SELL 4050"
  // Default to MARKET if no explicit order type is specified
  if (/BUY\s+\d+/i.test(upperText) || /SELL\s+\d+/i.test(upperText)) {
    return 'MARKET';
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
 * Extract numeric value from text following a pattern using regex
 * More flexible for complex patterns
 */
export function extractNumberAfterPatternRegex(text: string, pattern: RegExp): number | null {
  // Normalize multiple spaces to single space for better pattern matching
  const normalizedText = text.replace(/\s+/g, ' ');
  
  const match = normalizedText.match(pattern);
  if (!match || !match[1]) {
    return null;
  }
  
  const number = parseFloat(match[1]);
  if (isNaN(number)) {
    return null;
  }
  
  return number;
}

/**
 * Extract entry from range format like "Sell-4050-4055" or "BUY @ 4050-4055"
 * Returns the first price in the range as the entry
 */
export function extractEntryFromRange(text: string, direction: 'BUY' | 'SELL' | null): number | null {
  if (!direction) {
    return null;
  }
  
  const upperText = text.toUpperCase();
  
  // Look for patterns like "SELL-4050-4055" or "BUY-4050-4055"
  const rangePattern = new RegExp(`${direction}-(-?\\d+\\.?\\d*)-(-?\\d+\\.?\\d*)`, 'i');
  const rangeMatch = upperText.match(rangePattern);
  
  if (rangeMatch) {
    // Return the first price in the range as the entry
    const firstPrice = parseFloat(rangeMatch[1]);
    if (!isNaN(firstPrice)) {
      return firstPrice;
    }
  }
  
  // Look for patterns like "BUY @ 4050-4055" or "SELL @ 4050-4055"
  const atRangePattern = new RegExp(`${direction}\\s*@\\s*(-?\\d+\\.?\\d*)-(-?\\d+\\.?\\d*)`, 'i');
  const atRangeMatch = upperText.match(atRangePattern);
  
  if (atRangeMatch) {
    const firstPrice = parseFloat(atRangeMatch[1]);
    if (!isNaN(firstPrice)) {
      return firstPrice;
    }
  }
  
  // Look for patterns like "BUY@4050-4055" or "SELL@4050-4055" (no space after @)
  const atNoSpaceRangePattern = new RegExp(`${direction}@(-?\\d+\\.?\\d*)-(-?\\d+\\.?\\d*)`, 'i');
  const atNoSpaceRangeMatch = upperText.match(atNoSpaceRangePattern);
  
  if (atNoSpaceRangeMatch) {
    const firstPrice = parseFloat(atNoSpaceRangeMatch[1]);
    if (!isNaN(firstPrice)) {
      return firstPrice;
    }
  }
  
  // Look for patterns like "SELL 4050-4055" or "BUY 4050-4055" (space separated)
  const spaceRangePattern = new RegExp(`${direction}\\s+(-?\\d+\\.?\\d*)-(-?\\d+\\.?\\d*)`, 'i');
  const spaceRangeMatch = upperText.match(spaceRangePattern);
  
  if (spaceRangeMatch) {
    const firstPrice = parseFloat(spaceRangeMatch[1]);
    if (!isNaN(firstPrice)) {
      return firstPrice;
    }
  }
  
  // Look for patterns like "SELL:4050-4055" or "BUY:4050-4055" (colon separated)
  const colonRangePattern = new RegExp(`${direction}:(-?\\d+\\.?\\d*)-(-?\\d+\\.?\\d*)`, 'i');
  const colonRangeMatch = upperText.match(colonRangePattern);
  
  if (colonRangeMatch) {
    const firstPrice = parseFloat(colonRangeMatch[1]);
    if (!isNaN(firstPrice)) {
      return firstPrice;
    }
  }
  
  // Look for patterns like "SELL: 4050-4055" or "BUY: 4050-4055" (colon with space)
  const colonSpaceRangePattern = new RegExp(`${direction}:\\s*(-?\\d+\\.?\\d*)-(-?\\d+\\.?\\d*)`, 'i');
  const colonSpaceRangeMatch = upperText.match(colonSpaceRangePattern);
  
  if (colonSpaceRangeMatch) {
    const firstPrice = parseFloat(colonSpaceRangeMatch[1]);
    if (!isNaN(firstPrice)) {
      return firstPrice;
    }
  }
  
  // Look for patterns like "BUY LIMIT 4072:4071" or "SELL LIMIT 4060:4065" (colon separated range)
  const colonSeparatedRangePattern = new RegExp(`${direction}\\s+(?:LIMIT|LIMET|LIMITT)\\s*(-?\\d+\\.?\\d*):(-?\\d+\\.?\\d*)`, 'i');
  const colonSeparatedRangeMatch = upperText.match(colonSeparatedRangePattern);
  
  if (colonSeparatedRangeMatch) {
    const firstPrice = parseFloat(colonSeparatedRangeMatch[1]);
    if (!isNaN(firstPrice)) {
      return firstPrice;
    }
  }
  
  return null;
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
  
  // Check for range patterns first (e.g., "BUY-4050-4055", "SELL @ 4050-4055")
  // Extract direction locally to avoid circular dependency
  let direction: 'BUY' | 'SELL' | null = null;
  
  if (upperText.includes('BUY') && !upperText.includes('SELL')) {
    direction = 'BUY';
  } else if (upperText.includes('SELL') && !upperText.includes('BUY')) {
    direction = 'SELL';
  }
  
  const rangeEntry = extractEntryFromRange(text, direction);
  if (rangeEntry !== null) {
    return rangeEntry;
  }
  
  // Check for ENTRY keyword specifically
  if (upperText.includes('ENTRY') || upperText.includes('ENTRY:')) {
    const entryPattern = /ENTRY[:\s]*(-?\d+\.?\d*)/i;
    const entryMatch = normalizedText.match(entryPattern);
    if (entryMatch) {
      const number = parseFloat(entryMatch[1]);
      if (!isNaN(number)) {
        return number;
      }
    }
  }
  
  // Check for compact format: "BUY 4050" or "SELL 4050" (direction followed immediately by number)
  const directionNumberPattern = /(?:BUY|SELL)\s+(\d+\.?\d*)/i;
  const directionMatch = upperText.match(directionNumberPattern);
  if (directionMatch) {
    const number = parseFloat(directionMatch[1]);
    if (!isNaN(number)) {
      return number;
    }
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
  
  // Additional regex patterns for compact formats
  // Matches: SL 4064, SL:4064, S/L 4064, etc.
  const slRegex = /(?:SL|S\/L|STOP\s*LOSS|STOP)[:\s]*(-?\d+\.?\d*)/gi;
  const slMatch = normalizedText.match(slRegex);
  
  if (slMatch) {
    const numberMatch = slMatch[0].match(/(-?\d+\.?\d*)/);
    if (numberMatch) {
      const number = parseFloat(numberMatch[1]);
      if (!isNaN(number)) {
        return number;
      }
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
  // Also handles TP1:, TP2:, etc. and TP1 :4080 (space before colon)
  const tpRegex = /(?:TP\d*|TAKE\s+PROFIT)\s*[:\s]*(-?\d+\.?\d*)/gi;
  
  let match;
  while ((match = tpRegex.exec(normalizedText)) !== null) {
    const numberStr = match[1];
    const number = parseFloat(numberStr);
    
    if (!isNaN(number) && number > 0 && !takeProfits.includes(number)) {
      takeProfits.push(number);
    }
  }
  
  // Additional regex patterns for other TP formats
  // Matches: TGT 4091, TGT1 4095, TARGET 4091, P1 4095, etc.
  const tgtRegex = /(?:TGT\d*|TARGET\d*|PROFIT\d*|P\d*)\s*[:\s]*(-?\d+\.?\d*)/gi;
  while ((match = tgtRegex.exec(normalizedText)) !== null) {
    const numberStr = match[1];
    const number = parseFloat(numberStr);
    
    if (!isNaN(number) && number > 0 && !takeProfits.includes(number)) {
      takeProfits.push(number);
    }
  }
  
  // Match standalone numbers that might be TPs if they follow a pattern
  // This handles formats like: "TP 4045\nTP 4040\nTP 4035"
  const lines = normalizedText.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    // Check if line starts with TP-like pattern
    if (/^(TP|TGT|TARGET|PROFIT|P)\d*\s*[:\s]*/.test(trimmedLine)) {
      const numberMatch = trimmedLine.match(/(-?\d+\.?\d*)/);
      if (numberMatch) {
        const number = parseFloat(numberMatch[1]);
        if (!isNaN(number) && number > 0 && !takeProfits.includes(number)) {
          takeProfits.push(number);
        }
      }
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
    // Compact formats
    'BUY-',
    'SELL-',
    'TP:',
    'SL:',
    'TARGET',
    'STOP:',
    'ENTRY:',
    'P1',
    'P2',
    'P3',
    'TGT',
    // Direction with numbers
    /BUY\s*\d+/,
    /SELL\s*\d+/,
    // Hashtag formats
    '#XAUUSD',
    '#GOLD',
    // Pattern with price ranges
    /\d+-\d+/, // e.g., 4050-4055
  ];
  
  for (const indicator of strongIndicators) {
    if (typeof indicator === 'string') {
      if (upperText.includes(indicator)) {
        return true;
      }
    } else if (indicator instanceof RegExp) {
      if (indicator.test(upperText)) {
        return true;
      }
    }
  }
  
  // Check emoji indicators in original text
  const emojiIndicators = ['📈', '📉', '🟢', '🔴', '✅', '❌', '🎯', '🛡️'];
  for (const emoji of emojiIndicators) {
    if (normalizedText.includes(emoji)) {
      return true;
    }
  }
  
  return false;
}

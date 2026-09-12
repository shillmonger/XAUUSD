/**
 * Candidate Filter
 * Lightweight deterministic filter to identify Telegram messages that may contain trading signals
 * This is NOT the final trading validator - it only answers "is this worth sending to the AI?"
 */

/**
 * Trading signal keywords and phrases that suggest a message might contain a trading signal
 * This list is conservative but not exhaustive - the AI will do the actual validation
 */
const CANDIDATE_KEYWORDS = [
  // Symbol references
  'XAUUSD',
  'GOLD',
  'XAU',
  '#XAUUSD',
  '#GOLD',
  '#XAU',
  
  // Direction indicators
  'BUY',
  'SELL',
  'BUY NOW',
  'SELL NOW',
  'BUY-',
  'SELL-',
  'LONG',
  'SHORT',
  
  // Order types
  'BUY LIMIT',
  'SELL LIMIT',
  'BUY STOP',
  'SELL STOP',
  'LIMIT',
  'STOP',
  'BUY @',
  'SELL @',
  
  // Trading components
  'ENTRY',
  'TP',
  'TP1',
  'TP2',
  'TP3',
  'TP4',
  'TP5',
  'SL',
  'STOP LOSS',
  'TAKE PROFIT',
  'TARGET',
  'TGT',
  'TGT1',
  'TGT2',
  'TGT3',
  
  // Common trading phrases
  'ENTER',
  'ENTRY POINT',
  'TARGET',
  'STOP',
  'PROFIT',
  'P1',
  'P2',
  'P3'
];

/**
 * Check if a Telegram message is a candidate for AI signal extraction
 * @param messageText - The Telegram message text to analyze
 * @returns true if the message should be sent to the AI, false otherwise
 */
export function isCandidateSignal(messageText: string): boolean {
  if (!messageText || typeof messageText !== 'string') {
    return false;
  }

  // Normalize multiple spaces to single space for better pattern matching
  const normalizedText = messageText.replace(/\s+/g, ' ');
  const upperText = normalizedText.toUpperCase();

  // Check for any candidate keywords
  for (const keyword of CANDIDATE_KEYWORDS) {
    if (upperText.includes(keyword.toUpperCase())) {
      console.log(`[Candidate Filter] Message contains keyword: "${keyword}"`);
      return true;
    }
  }

  return false;
}

/**
 * Additional filter to specifically check for XAUUSD/GOLD context
 * This helps reduce false positives from general trading discussions
 */
export function hasXAUUSDContext(messageText: string): boolean {
  if (!messageText || typeof messageText !== 'string') {
    return false;
  }

  // Normalize multiple spaces to single space for better pattern matching
  const normalizedText = messageText.replace(/\s+/g, ' ');
  const upperText = normalizedText.toUpperCase();

  // Check for explicit XAUUSD or GOLD references (including hashtag variants)
  return upperText.includes('XAUUSD') || 
         upperText.includes('GOLD') || 
         upperText.includes('XAU') ||
         upperText.includes('#XAUUSD') || 
         upperText.includes('#GOLD') || 
         upperText.includes('#XAU');
}

/**
 * Check if message has strong trading signal indicators
 * This helps distinguish between trading signals and market commentary
 */
export function hasStrongTradingIndicators(messageText: string): boolean {
  if (!messageText || typeof messageText !== 'string') {
    return false;
  }

  // Normalize multiple spaces to single space for better pattern matching
  const normalizedText = messageText.replace(/\s+/g, ' ');
  const upperText = normalizedText.toUpperCase();

  // Strong trading indicators that suggest a concrete signal
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
    // Direction with numbers (regex patterns)
    /BUY\s*\d+/,
    /SELL\s*\d+/,
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

  return false;
}

/**
 * Combined candidate filter
 * First checks for trading keywords, then optionally checks for XAUUSD context
 * @param messageText - The Telegram message text to analyze
 * @param requireXAUUSDContext - Whether to require XAUUSD/GOLD context (default: true)
 * @returns true if the message should be sent to the AI, false otherwise
 */
export function isCandidateSignalWithContext(
  messageText: string,
  requireXAUUSDContext: boolean = true
): boolean {
  // Normalize multiple spaces to single space for better pattern matching
  const normalizedText = messageText.replace(/\s+/g, ' ');
  
  const hasKeywords = isCandidateSignal(normalizedText);

  if (!hasKeywords) {
    return false;
  }

  if (requireXAUUSDContext) {
    const hasXAUUSD = hasXAUUSDContext(normalizedText);
    
    // If it has XAUUSD/GOLD context, also check for strong trading indicators
    // This helps filter out market commentary vs actual trading signals
    if (hasXAUUSD) {
      return hasStrongTradingIndicators(normalizedText);
    }
    
    return false;
  }

  return true;
}
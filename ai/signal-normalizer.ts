/**
 * Signal Normalizer
 * Normalizes different wording and formats into our internal signal format
 */

/**
 * Normalize symbol to XAUUSD
 */
export function normalizeSymbol(symbol: string | null): string | null {
  if (!symbol) {
    return null;
  }
  
  const upperSymbol = symbol.toUpperCase();
  
  // All valid gold references normalize to XAUUSD
  if (['XAUUSD', 'XAU/USD', 'GOLD', 'XAU'].includes(upperSymbol)) {
    return 'XAUUSD';
  }
  
  // Reject unsupported symbols
  return null;
}

/**
 * Normalize direction to BUY or SELL
 */
export function normalizeDirection(direction: string | null): 'BUY' | 'SELL' | null {
  if (!direction) {
    return null;
  }
  
  const upperDirection = direction.toUpperCase();
  
  if (['BUY', 'LONG'].includes(upperDirection)) {
    return 'BUY';
  }
  
  if (['SELL', 'SHORT'].includes(upperDirection)) {
    return 'SELL';
  }
  
  return null;
}

/**
 * Normalize order type to MARKET, LIMIT, or STOP
 * NOTE: LIMIT orders are converted to MARKET since Deriv Multipliers don't support LIMIT orders
 */
export function normalizeOrderType(orderType: string | null): 'MARKET' | 'LIMIT' | 'STOP' | null {
  if (!orderType) {
    return null;
  }
  
  const upperOrderType = orderType.toUpperCase();
  
  if (['MARKET'].includes(upperOrderType)) {
    return 'MARKET';
  }
  
  if (['LIMIT'].includes(upperOrderType)) {
    // Convert LIMIT to MARKET since Deriv Multipliers don't support LIMIT orders
    console.log(`[Signal Normalizer] Converting LIMIT order to MARKET for Deriv Multipliers compatibility`);
    return 'MARKET';
  }
  
  if (['STOP'].includes(upperOrderType)) {
    return 'STOP';
  }
  
  return null;
}

/**
 * Normalize numeric price values
 * Validates that the number is a valid trading price
 */
export function normalizePrice(price: number | null | undefined): number | undefined {
  if (price === null || price === undefined) {
    return undefined;
  }
  
  // Reject invalid numbers
  if (isNaN(price) || !isFinite(price)) {
    return undefined;
  }
  
  // Reject negative prices
  if (price < 0) {
    return undefined;
  }
  
  // Reject zero prices
  if (price === 0) {
    return undefined;
  }
  
  // For XAUUSD, typical range is 2000-5000
  // Allow some flexibility but reject obviously wrong values
  if (price < 1000 || price > 10000) {
    return undefined;
  }
  
  return price;
}

/**
 * Normalize take profit array
 * Filters out invalid values and removes duplicates
 */
export function normalizeTakeProfits(takeProfits: number[]): number[] {
  if (!Array.isArray(takeProfits)) {
    return [];
  }
  
  // Filter and normalize each TP
  const normalized: number[] = [];
  for (const tp of takeProfits) {
    const normalizedTp = normalizePrice(tp);
    if (normalizedTp !== undefined) {
      normalized.push(normalizedTp);
    }
  }
  
  // Remove duplicates
  const unique = [...new Set(normalized)];
  
  // Sort in ascending order
  unique.sort((a, b) => a - b);
  
  return unique;
}

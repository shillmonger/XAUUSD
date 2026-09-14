/**
 * Deriv Symbol Mapper Service
 * Verifies and maps internal symbols to Deriv underlying symbols
 * 
 * This service:
 * - Queries Deriv active_symbols to verify correct underlying symbols
 * - Maps internal XAUUSD to actual Deriv underlying symbol
 * - Caches symbol mappings for performance
 * - Ensures we use the correct current Deriv API field names
 */

import { createDerivApiClient, DerivApiClient } from './deriv-api-client.service';

export interface SymbolMapping {
  internalSymbol: string;
  derivSymbol: string;
  underlyingSymbolName: string;
  market: string;
  verified: boolean;
  verifiedAt: Date;
}

/**
 * Deriv Symbol Mapper
 */
export class DerivSymbolMapper {
  private apiClient: DerivApiClient | null = null;
  private symbolCache: Map<string, SymbolMapping> = new Map();
  private cacheExpiry = 3600000; // 1 hour in milliseconds

  /**
   * Initialize the symbol mapper with an API client
   */
  private async initializeApiClient(derivAccountId: string, accessToken: string, accountType: 'demo' | 'real'): Promise<void> {
    this.apiClient = await createDerivApiClient(derivAccountId, accessToken, accountType);
  }

  /**
   * Get active symbols from Deriv
   */
  private async getActiveSymbols(derivAccountId: string, accessToken: string, accountType: 'demo' | 'real'): Promise<any[]> {
    if (!this.apiClient) {
      await this.initializeApiClient(derivAccountId, accessToken, accountType);
    }

    return await this.apiClient!.getActiveSymbols();
  }

  /**
   * Find the correct Deriv underlying symbol for an internal symbol
   */
  private findDerivSymbol(activeSymbols: any[], internalSymbol: string): string | null {
    console.log('[DerivSymbolMapper] Searching for symbol:', internalSymbol);
    console.log('[DerivSymbolMapper] Total active symbols:', activeSymbols.length);

    // Common patterns for XAUUSD in Deriv
    const xauPatterns = [
      'frxXAUUSD',  // Most common pattern
      'XAUUSD',     // Direct symbol
      'GOLD',       // Alternative name
      'frxGOLD',    // Pattern with prefix
    ];

    // First, try exact match
    const exactMatch = activeSymbols.find(s => 
      s.underlying_symbol === internalSymbol || 
      s.underlying_symbol_name === internalSymbol
    );

    if (exactMatch) {
      console.log('[DerivSymbolMapper] Exact match found:', exactMatch.underlying_symbol);
      return exactMatch.underlying_symbol;
    }

    // For XAUUSD, try common patterns
    if (internalSymbol === 'XAUUSD') {
      console.log('[DerivSymbolMapper] Trying XAUUSD patterns:', xauPatterns);
      for (const pattern of xauPatterns) {
        const match = activeSymbols.find(s => 
          s.underlying_symbol === pattern ||
          s.underlying_symbol.toLowerCase().includes('xau') ||
          s.underlying_symbol_name.toLowerCase().includes('gold') ||
          s.underlying_symbol_name.toLowerCase().includes('xau')
        );

        if (match) {
          console.log('[DerivSymbolMapper] Pattern match found:', match.underlying_symbol, 'from pattern:', pattern);
          return match.underlying_symbol;
        }
      }
    }

    // For other symbols, try common forex pattern
    const forexPattern = `frx${internalSymbol}`;
    const forexMatch = activeSymbols.find(s => s.underlying_symbol === forexPattern);
    if (forexMatch) {
      console.log('[DerivSymbolMapper] Forex pattern match found:', forexMatch.underlying_symbol);
      return forexMatch.underlying_symbol;
    }

    console.log('[DerivSymbolMapper] No match found for:', internalSymbol);
    console.log('[DerivSymbolMapper] Sample available symbols:', activeSymbols.slice(0, 5).map(s => ({
      symbol: s.underlying_symbol,
      name: s.underlying_symbol_name,
      market: s.market
    })));

    return null;
  }

  /**
   * Verify and cache symbol mapping
   */
  async verifySymbolMapping(
    internalSymbol: string,
    derivAccountId: string,
    accessToken: string,
    accountType: 'demo' | 'real'
  ): Promise<SymbolMapping> {
    // Check cache first
    const cached = this.symbolCache.get(internalSymbol);
    if (cached && Date.now() - cached.verifiedAt.getTime() < this.cacheExpiry) {
      console.log(`[DerivSymbolMapper] Using cached mapping for ${internalSymbol}`);
      return cached;
    }

    console.log(`[DerivSymbolMapper] Verifying symbol mapping for ${internalSymbol}`);

    try {
      // Get active symbols from Deriv
      const activeSymbols = await this.getActiveSymbols(derivAccountId, accessToken, accountType);
      console.log(`[DerivSymbolMapper] Retrieved ${activeSymbols.length} active symbols`);

      // Find the correct Deriv symbol
      const derivSymbol = this.findDerivSymbol(activeSymbols, internalSymbol);

      if (!derivSymbol) {
        throw new Error(`No Deriv symbol found for ${internalSymbol}`);
      }

      // Get symbol details
      const symbolDetails = activeSymbols.find(s => s.underlying_symbol === derivSymbol);

      // Create mapping
      const mapping: SymbolMapping = {
        internalSymbol,
        derivSymbol,
        underlyingSymbolName: symbolDetails?.underlying_symbol_name || derivSymbol,
        market: symbolDetails?.market || 'unknown',
        verified: true,
        verifiedAt: new Date()
      };

      // Cache the mapping
      this.symbolCache.set(internalSymbol, mapping);

      console.log(`[DerivSymbolMapper] Verified mapping: ${internalSymbol} -> ${derivSymbol} (${mapping.underlyingSymbolName})`);

      return mapping;

    } catch (error) {
      console.error(`[DerivSymbolMapper] Failed to verify symbol mapping:`, error);
      throw error;
    } finally {
      // Clean up API client
      if (this.apiClient) {
        this.apiClient.disconnect();
        this.apiClient = null;
      }
    }
  }

  /**
   * Get cached mapping without verification
   */
  getCachedMapping(internalSymbol: string): SymbolMapping | null {
    const cached = this.symbolCache.get(internalSymbol);
    if (cached && Date.now() - cached.verifiedAt.getTime() < this.cacheExpiry) {
      return cached;
    }
    return null;
  }

  /**
   * Clear the symbol cache
   */
  clearCache(): void {
    this.symbolCache.clear();
    console.log(`[DerivSymbolMapper] Symbol cache cleared`);
  }

  /**
   * Get all cached mappings
   */
  getAllCachedMappings(): SymbolMapping[] {
    return Array.from(this.symbolCache.values());
  }
}

// Export singleton instance
export const derivSymbolMapper = new DerivSymbolMapper();

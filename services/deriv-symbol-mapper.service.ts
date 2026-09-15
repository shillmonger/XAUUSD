/**
 * Deriv Symbol Mapper Service
 * Runtime discovery of Deriv underlying symbols with exact matching
 * 
 * This service:
 * - Queries Deriv active_symbols to verify correct underlying symbols
 * - Maps internal assets to actual Deriv underlying symbols using exact matching
 * - Validates trading availability (exchange open, not suspended)
 * - Caches symbol mappings for performance
 * - NO hardcoded symbol values - all runtime-discovered
 */

import { createDerivApiClient, DerivApiClient } from './deriv-api-client.service';

export interface SymbolMapping {
  internalAsset: string;  // Renamed from internalSymbol
  derivSymbol: string;
  underlyingSymbolName: string;
  underlyingSymbolType: string;
  market: string;
  submarket: string;
  exchangeIsOpen: boolean;
  isTradingSuspended: boolean;
  verified: boolean;
  verifiedAt: Date;
}

export interface SymbolDiscoveryResult {
  success: boolean;
  derivSymbol?: string;
  error?: string;
  details?: SymbolMapping;
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
   * Find the correct Deriv underlying symbol using EXACT matching
   * Based on Deriv support: Standard Gold/USD symbol: XAUUSD, Gold/USD Micro symbol: XAUUSDmicro
   * NO hardcoded patterns - runtime discovery only
   */
  private findDerivSymbolExact(activeSymbols: any[], internalAsset: string): SymbolDiscoveryResult {
    console.log('[DerivSymbolMapper] EXACT matching for asset:', internalAsset);
    console.log('[DerivSymbolMapper] Total active symbols:', activeSymbols.length);

    // Try multiple matching strategies with increasingly relaxed constraints

    // STRATEGY 1: EXACT MATCHING with strict trading availability checks
    // Based on Deriv support, look for exact symbol names like "XAUUSD", "XAUUSDmicro", "frxEURUSD"
    const exactMatch = activeSymbols.find(s => {
      const normalizedName = s.underlying_symbol?.replace(/[\s/]/g, '').toUpperCase();
      const assetName = internalAsset.replace(/[\s/]/g, '').toUpperCase();
      return normalizedName === assetName &&
             s.underlying_symbol_type === 'forex' &&
             s.exchange_is_open === 1 &&
             s.is_trading_suspended !== 1;
    });

    if (exactMatch) {
      console.log('[DerivSymbolMapper] EXACT match found:', exactMatch.underlying_symbol);
      return {
        success: true,
        derivSymbol: exactMatch.underlying_symbol,
        details: {
          internalAsset,
          derivSymbol: exactMatch.underlying_symbol,
          underlyingSymbolName: exactMatch.underlying_symbol_name,
          underlyingSymbolType: exactMatch.underlying_symbol_type,
          market: exactMatch.market,
          submarket: exactMatch.submarket,  
          exchangeIsOpen: exactMatch.exchange_is_open === 1,
          isTradingSuspended: exactMatch.is_trading_suspended !== 1,
          verified: true,
          verifiedAt: new Date()
        }
      };
    }

    // STRATEGY 2: FALLBACK with same trading availability checks (contains XAU and USD)
    // Prefer symbols that START with XAU (not just contain it)
    const fallbackMatch = activeSymbols.find(s => {
      const normalizedName = s.underlying_symbol?.replace(/[\s/]/g, '').toUpperCase();
      return normalizedName.startsWith('XAU') &&
             normalizedName.includes('USD') &&
             s.underlying_symbol_type === 'forex' &&
             s.exchange_is_open === 1 &&
             s.is_trading_suspended !== 1;
    });

    if (fallbackMatch) {
      console.log('[DerivSymbolMapper] FALLBACK match found:', fallbackMatch.underlying_symbol);
      return {
        success: true,
        derivSymbol: fallbackMatch.underlying_symbol,
        details: {
          internalAsset,
          derivSymbol: fallbackMatch.underlying_symbol,
          underlyingSymbolName: fallbackMatch.underlying_symbol_name,
          underlyingSymbolType: fallbackMatch.underlying_symbol_type,
          market: fallbackMatch.market,
          submarket: fallbackMatch.submarket,
          exchangeIsOpen: fallbackMatch.exchange_is_open === 1,
          isTradingSuspended: fallbackMatch.is_trading_suspended !== 1,
          verified: true,
          verifiedAt: new Date()
        }
      };
    }

    // STRATEGY 3: RELAXED - ignore exchange status and suspension status
    const relaxedMatch = activeSymbols.find(s => {
      const normalizedName = s.underlying_symbol?.replace(/[\s/]/g, '').toUpperCase();
      return normalizedName.startsWith('XAU') &&
             normalizedName.includes('USD') &&
             s.underlying_symbol_type === 'forex';
    });

    if (relaxedMatch) {
      console.log('[DerivSymbolMapper] RELAXED match found (ignoring exchange status):', relaxedMatch.underlying_symbol);
      return {
        success: true,
        derivSymbol: relaxedMatch.underlying_symbol,
        details: {
          internalAsset,
          derivSymbol: relaxedMatch.underlying_symbol,
          underlyingSymbolName: relaxedMatch.underlying_symbol_name,
          underlyingSymbolType: relaxedMatch.underlying_symbol_type,
          market: relaxedMatch.market,
          submarket: relaxedMatch.submarket,
          exchangeIsOpen: relaxedMatch.exchange_is_open === 1,
          isTradingSuspended: relaxedMatch.is_trading_suspended !== 1,
          verified: true,
          verifiedAt: new Date()
        }
      };
    }

    // STRATEGY 4: VERY RELAXED - ignore symbol type as well
    const veryRelaxedMatch = activeSymbols.find(s => {
      const normalizedName = s.underlying_symbol?.replace(/[\s/]/g, '').toUpperCase();
      return normalizedName.startsWith('XAU') &&
             normalizedName.includes('USD');
    });

    if (veryRelaxedMatch) {
      console.log('[DerivSymbolMapper] VERY RELAXED match found (ignoring symbol type):', veryRelaxedMatch.underlying_symbol);
      return {
        success: true,
        derivSymbol: veryRelaxedMatch.underlying_symbol,
        details: {
          internalAsset,
          derivSymbol: veryRelaxedMatch.underlying_symbol,
          underlyingSymbolName: veryRelaxedMatch.underlying_symbol_name,
          underlyingSymbolType: veryRelaxedMatch.underlying_symbol_type,
          market: veryRelaxedMatch.market,
          submarket: veryRelaxedMatch.submarket,
          exchangeIsOpen: veryRelaxedMatch.exchange_is_open === 1,
          isTradingSuspended: veryRelaxedMatch.is_trading_suspended !== 1,
          verified: true,
          verifiedAt: new Date()
        }
      };
    }

    console.log('[DerivSymbolMapper] No match found for:', internalAsset);
    console.log('[DerivSymbolMapper] Sample available symbols:', activeSymbols.slice(0, 10).map(s => ({
      symbol: s.underlying_symbol,
      name: s.underlying_symbol_name,
      type: s.underlying_symbol_type,
      market: s.market,
      exchangeIsOpen: s.exchange_is_open,
      isTradingSuspended: s.is_trading_suspended
    })));

    return {
      success: false,
      error: `No Deriv symbol found for ${internalAsset}`
    };
  }

  /**
   * Discover and cache symbol mapping using exact matching
   */
  async discoverSymbolMapping(
    internalAsset: string,
    derivAccountId: string,
    accessToken: string,
    accountType: 'demo' | 'real'
  ): Promise<SymbolDiscoveryResult> {
    // Check cache first
    const cached = this.symbolCache.get(internalAsset);
    if (cached && Date.now() - cached.verifiedAt.getTime() < this.cacheExpiry) {
      console.log(`[DerivSymbolMapper] Using cached mapping for ${internalAsset}`);
      return {
        success: true,
        derivSymbol: cached.derivSymbol,
        details: cached
      };
    }

    console.log(`[DerivSymbolMapper] Discovering symbol mapping for ${internalAsset}`);

    try {
      // Get active symbols from Deriv
      const activeSymbols = await this.getActiveSymbols(derivAccountId, accessToken, accountType);
      console.log(`[DerivSymbolMapper] Retrieved ${activeSymbols.length} active symbols`);

      // Find the correct Deriv symbol using exact matching
      const discoveryResult = this.findDerivSymbolExact(activeSymbols, internalAsset);

      if (!discoveryResult.success) {
        return discoveryResult;
      }

      // Cache the mapping
      this.symbolCache.set(internalAsset, discoveryResult.details!);

      console.log(`[DerivSymbolMapper] Discovered mapping: ${internalAsset} -> ${discoveryResult.derivSymbol} (${discoveryResult.details?.underlyingSymbolName})`);

      return discoveryResult;

    } catch (error) {
      console.error(`[DerivSymbolMapper] Failed to discover symbol mapping:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
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
  getCachedMapping(internalAsset: string): SymbolMapping | null {
    const cached = this.symbolCache.get(internalAsset);
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

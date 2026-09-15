import MT5SignalQueueModel from '@/models/MT5SignalQueue';

/**
 * MT5 Execution Service
 * Handles preparation and management of MT5/CFD trade execution
 * 
 * This service:
 * - Prepares XAUUSD CFD trade signals for MT5 execution
 * - Defines the interface for MT5 Expert Advisor integration
 * - Manages MT5 position state and monitoring
 * - Converts internal signals to MT5-compatible format
 * - Handles SL/TP for MT5 positions
 * 
 * CRITICAL: Deriv MT5 API does NOT support programmatic trading.
 * This service prepares data for execution by an MT5 Expert Advisor.
 * The actual trade execution happens in the MT5 platform via EA.
 */

export interface MT5TradeSignal {
  signalId: string;
  userId: string;
  mt5Login: string;
  mt5Server: string;
  accountType: 'demo' | 'real';
  
  // Trade parameters
  symbol: string; // XAUUSD
  side: 'BUY' | 'SELL';
  volume: number; // Lot size (e.g., 0.01)
  entryPrice?: number;
  stopLoss: number;
  takeProfit: number;
  
  // Timing
  createdAt: Date;
  expiresAt?: Date;
  
  // Status tracking
  status: 'pending' | 'sent_to_mt5' | 'executed' | 'failed' | 'expired';
  executionId?: string; // MT5 order/ticket ID
  executionError?: string;
  
  // Metadata
  source: 'telegram_signal';
  sourceMetadata?: any;
}

export interface MT5Position {
  positionId: string;
  mt5Login: string;
  mt5Server: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  volume: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  profit: number;
  openTime: Date;
  closeTime?: Date;
  status: 'open' | 'closed' | 'modified';
  comment?: string;
}

export interface MT5ExecutionRequest {
  action: 'open_position' | 'close_position' | 'modify_position';
  signalId: string;
  userId: string;
  mt5Login: string;
  mt5Server: string;
  accountType: 'demo' | 'real';
  
  // Position parameters
  symbol: string;
  side: 'BUY' | 'SELL';
  volume: number;
  entryPrice?: number;
  stopLoss: number;
  takeProfit: number;
  
  // Position modification (if applicable)
  positionId?: string;
  newStopLoss?: number;
  newTakeProfit?: number;
}

export interface MT5ExecutionResponse {
  success: boolean;
  executionId?: string;
  positionId?: string;
  error?: string;
  executedAt?: Date;
  metadata?: any;
}

/**
 * MT5 Execution Service
 * 
 * This service acts as the bridge between our signal system and MT5 execution.
 * Since Deriv doesn't provide API-based MT5 trading, this service:
 * 1. Receives validated XAUUSD signals
 * 2. Converts them to MT5-compatible format
 * 3. Makes them available for MT5 Expert Advisor execution
 * 4. Tracks execution status and position state
 */
export class MT5ExecutionService {
  /**
   * Convert internal signal format to MT5 trade signal
   */
  static convertToMT5Signal(
    signalId: string,
    userId: string,
    mt5Login: string,
    mt5Server: string,
    accountType: 'demo' | 'real',
    asset: string,
    direction: 'BUY' | 'SELL',
    entryPrice: number | undefined,
    stopLoss: number,
    takeProfit: number,
    stake: number
  ): MT5TradeSignal {
    
    // Convert stake to MT5 lot size (this may need adjustment based on asset)
    // For XAUUSD, typical lot sizing: 1 lot = 100 units, 0.01 lot = 1 unit
    // This is a simplified conversion - may need per-asset logic
    const volume = this.convertStakeToVolume(asset, stake);
    
    // Convert asset to MT5 symbol format
    const symbol = this.convertAssetToMT5Symbol(asset);
    
    return {
      signalId,
      userId,
      mt5Login,
      mt5Server,
      accountType,
      symbol,
      side: direction,
      volume,
      entryPrice,
      stopLoss,
      takeProfit,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minute expiry
      status: 'pending',
      source: 'telegram_signal',
    };
  }

  /**
   * Convert stake amount to MT5 lot size
   * This is asset-specific and may need adjustment
   */
  private static convertStakeToVolume(asset: string, stake: number): number {
    // Simplified conversion logic for XAUUSD
    // In practice, this should consider:
    // - Asset contract specifications
    // - Account currency
    // - Risk management rules
    // - User preferences
    
    if (asset.toUpperCase() === 'XAUUSD') {
      // For XAUUSD: 1 lot = 100 oz, typical minimum 0.01 lot
      // This is a placeholder - actual conversion depends on broker specs
      return Math.max(0.01, Math.min(100, stake / 100)); // Conservative conversion
    }
    
    // Default conversion for other assets
    return Math.max(0.01, stake / 1000);
  }

  /**
   * Convert internal asset name to MT5 symbol format
   */
  private static convertAssetToMT5Symbol(asset: string): string {
    // Map common asset names to MT5 symbol formats
    const symbolMap: Record<string, string> = {
      'XAUUSD': 'XAUUSD',
      'GOLD': 'XAUUSD',
      'EURUSD': 'EURUSD',
      'GBPUSD': 'GBPUSD',
      'USDJPY': 'USDJPY',
    };
    
    const mt5Symbol = symbolMap[asset.toUpperCase()];
    if (mt5Symbol) {
      return mt5Symbol;
    }
    
    // Default to uppercase if no mapping found
    return asset.toUpperCase();
  }

  /**
   * Validate MT5 trade signal before execution
   */
  static validateMT5Signal(signal: MT5TradeSignal): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Validate required fields
    if (!signal.signalId) errors.push('Signal ID is required');
    if (!signal.userId) errors.push('User ID is required');
    if (!signal.mt5Login) errors.push('MT5 login is required');
    if (!signal.mt5Server) errors.push('MT5 server is required');
    
    // Validate trade parameters
    if (!signal.symbol) errors.push('Symbol is required');
    if (signal.symbol !== 'XAUUSD') errors.push('Only XAUUSD CFD is supported for Deriv MT5 execution');
    if (!['BUY', 'SELL'].includes(signal.side)) errors.push('Invalid side');
    if (signal.volume <= 0) errors.push('Volume must be positive');
    if (signal.stopLoss <= 0) errors.push('Stop loss must be positive');
    if (signal.takeProfit <= 0) errors.push('Take profit must be positive');
    
    // Validate SL/TP relationship
    if (signal.side === 'BUY' && signal.stopLoss >= signal.takeProfit) {
      errors.push('For BUY orders, stop loss must be below take profit');
    }
    if (signal.side === 'SELL' && signal.stopLoss <= signal.takeProfit) {
      errors.push('For SELL orders, stop loss must be above take profit');
    }
    
    // Validate expiry
    if (signal.expiresAt && signal.expiresAt < new Date()) {
      errors.push('Signal has expired');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Prepare execution request for MT5 Expert Advisor
   * This is the format that the EA should consume
   */
  static prepareExecutionRequest(signal: MT5TradeSignal): MT5ExecutionRequest {
    return {
      action: 'open_position',
      signalId: signal.signalId,
      userId: signal.userId,
      mt5Login: signal.mt5Login,
      mt5Server: signal.mt5Server,
      accountType: signal.accountType,
      symbol: signal.symbol,
      side: signal.side,
      volume: signal.volume,
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
    };
  }

  /**
   * Process execution response from MT5 Expert Advisor
   */
  static processExecutionResponse(
    signalId: string,
    response: MT5ExecutionResponse
  ): {
    success: boolean;
    shouldRetry: boolean;
    nextAction?: string;
  } {
    if (response.success) {
      return {
        success: true,
        shouldRetry: false,
      };
    }
    
    // Determine if execution should be retried
    const retryableErrors = [
      'connection_error',
      'timeout',
      'server_error',
      'quote_expired',
    ];
    
    const shouldRetry = retryableErrors.some(error => 
      response.error?.toLowerCase().includes(error)
    );
    
    return {
      success: false,
      shouldRetry,
      nextAction: shouldRetry ? 'retry_execution' : 'mark_failed',
    };
  }

  /**
   * Calculate suggested SL/TP levels based on entry price and risk parameters
   * This can be used as a fallback or suggestion system
   */
  static calculateSuggestedSLTP(
    entryPrice: number,
    side: 'BUY' | 'SELL',
    riskPercentage: number = 1.0, // 1% risk
    rewardRiskRatio: number = 2.0 // 2:1 reward:risk
  ): {
    stopLoss: number;
    takeProfit: number;
  } {
    const riskAmount = entryPrice * (riskPercentage / 100);
    
    if (side === 'BUY') {
      return {
        stopLoss: entryPrice - riskAmount,
        takeProfit: entryPrice + (riskAmount * rewardRiskRatio),
      };
    } else {
      return {
        stopLoss: entryPrice + riskAmount,
        takeProfit: entryPrice - (riskAmount * rewardRiskRatio),
      };
    }
  }
}

/**
 * MT5 Signal Queue for Expert Advisor consumption
 *
 * Provides database-backed signal queue operations.
 * The MT5 Expert Advisor polls GET /api/deriv/mt5/signals to consume signals
 * and reports results back via POST /api/deriv/mt5/signals/[signalId]/result.
 *
 * This class provides utility methods for internal use (e.g. cron jobs,
 * monitoring). The actual queue storage is in the MT5SignalQueue Mongoose model.
 */
export class MT5SignalQueue {
  /**
   * Store a signal in the database for MT5 Expert Advisor consumption.
   * The EA polls GET /api/deriv/mt5/signals?mt5Login=<login>&status=pending
   */
  static async enqueueSignal(signal: MT5TradeSignal): Promise<void> {
    await MT5SignalQueueModel.create({
      signalId: signal.signalId,
      userId: signal.userId,
      mt5Login: signal.mt5Login,
      mt5Server: signal.mt5Server,
      accountType: signal.accountType,
      symbol: signal.symbol,
      side: signal.side,
      volume: signal.volume,
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      status: 'pending',
      source: signal.source,
      expiresAt: signal.expiresAt,
      createdAt: signal.createdAt,
    });

    console.log('[MT5SignalQueue] Signal persisted to database queue:', {
      signalId: signal.signalId,
      symbol: signal.symbol,
      side: signal.side,
      volume: signal.volume,
      mt5Login: signal.mt5Login.substring(0, 6) + '...',
    });
  }

  /**
   * Get pending signals for a specific MT5 account.
   * Mirrors what GET /api/deriv/mt5/signals returns to the EA.
   */
  static async getPendingSignals(mt5Login: string): Promise<MT5TradeSignal[]> {
    const now = new Date();

    // Mark expired signals first
    await MT5SignalQueueModel.updateMany(
      { mt5Login, status: 'pending', expiresAt: { $lt: now } },
      { $set: { status: 'expired' } }
    );

    const docs = await MT5SignalQueueModel.find({ mt5Login, status: 'pending' })
      .sort({ createdAt: 1 })
      .lean();

    return docs.map((d) => ({
      signalId: d.signalId,
      userId: d.userId,
      mt5Login: d.mt5Login,
      mt5Server: d.mt5Server,
      accountType: d.accountType,
      symbol: d.symbol,
      side: d.side as 'BUY' | 'SELL',
      volume: d.volume,
      entryPrice: d.entryPrice,
      stopLoss: d.stopLoss,
      takeProfit: d.takeProfit,
      createdAt: d.createdAt,
      expiresAt: d.expiresAt,
      status: d.status as MT5TradeSignal['status'],
      source: d.source as 'telegram_signal',
    }));
  }

  /**
   * Update signal status after MT5 Expert Advisor reports back.
   * In normal operation the EA uses POST /api/deriv/mt5/signals/[signalId]/result.
   * This method is a programmatic alternative for internal use.
   */
  static async updateSignalStatus(
    signalId: string,
    status: 'executed' | 'failed',
    positionId?: string,
    error?: string
  ): Promise<void> {
    await MT5SignalQueueModel.updateOne(
      { signalId },
      {
        $set: {
          status,
          positionId,
          executionError: error,
          executedAt: new Date(),
        },
      }
    );

    console.log('[MT5SignalQueue] Signal status updated:', {
      signalId,
      status,
      positionId,
      error,
    });
  }
}

export default MT5ExecutionService;
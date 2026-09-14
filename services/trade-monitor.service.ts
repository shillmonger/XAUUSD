/**
 * Trade Monitor Service (Phase 9)
 * Monitors open demo copy trades and updates their status with Deriv
 * 
 * This service:
 * - Queries open demo copy trades from MongoDB
 * - Authenticates to Deriv for each trade's account
 * - Checks current contract state using Deriv API
 * - Updates floating P/L while trades remain open
 * - Marks trades closed when Deriv confirms closure
 * - Handles errors gracefully without falsely closing trades
 * - Enforces demo-only monitoring
 * - Reuses existing Deriv authentication and API client
 */

import CopyTrade from '@/models/CopyTrade';
import DerivAccount from '@/models/DerivAccount';
import { decrypt } from '@/lib/encryption';
import { createDerivApiClient, DerivApiClient } from './deriv-api-client.service';

export interface MonitorResult {
  tradeId: string;
  userId: string;
  derivAccountId: string;
  brokerContractId?: string;
  success: boolean;
  status?: 'OPEN' | 'CLOSED';
  profitLoss?: number;
  error?: string;
  wasAlreadyClosed?: boolean;
}

export interface MonitorSummary {
  jobName: string;
  startedAt: Date;
  finishedAt: Date;
  duration: number;
  totalTradesFound: number;
  tradesProcessed: number;
  tradesStillOpen: number;
  tradesClosed: number;
  tradesSkipped: number;
  tradesFailed: number;
  errors: number;
  results: MonitorResult[];
}

/**
 * Trade Monitor Service
 */
export class TradeMonitorService {
  
  /**
   * Process all open demo copy trades
   */
  async monitorOpenTrades(): Promise<MonitorSummary> {
    const startedAt = new Date();
    console.log('[TradeMonitor] Trade monitor started');
    
    const summary: MonitorSummary = {
      jobName: 'trade-monitor',
      startedAt,
      finishedAt: new Date(),
      duration: 0,
      totalTradesFound: 0,
      tradesProcessed: 0,
      tradesStillOpen: 0,
      tradesClosed: 0,
      tradesSkipped: 0,
      tradesFailed: 0,
      errors: 0,
      results: []
    };
    
    try {
      // Step 1: Find all open demo copy trades
      const openTrades = await CopyTrade.find({
        status: 'OPEN',
        accountType: 'demo',
        broker: 'deriv'
      });
      
      summary.totalTradesFound = openTrades.length;
      console.log(`[TradeMonitor] Open demo copy trades found: ${openTrades.length}`);
      
      if (openTrades.length === 0) {
        console.log('[TradeMonitor] No open trades to monitor');
        return summary;
      }
      
      // Step 2: Process each trade independently
      for (const trade of openTrades) {
        console.log(`[TradeMonitor] Monitoring copy trade: ${trade._id}`);
        
        try {
          const result = await this.monitorSingleTrade(trade);
          summary.results.push(result);
          summary.tradesProcessed++;
          
          if (result.wasAlreadyClosed) {
            summary.tradesSkipped++;
          } else if (result.success) {
            if (result.status === 'OPEN') {
              summary.tradesStillOpen++;
            } else if (result.status === 'CLOSED') {
              summary.tradesClosed++;
            }
          } else {
            summary.tradesFailed++;
            summary.errors++;
          }
          
        } catch (error) {
          console.error(`[TradeMonitor] Error monitoring trade ${trade._id}:`, error);
          summary.tradesFailed++;
          summary.errors++;
          summary.results.push({
            tradeId: trade._id.toString(),
            userId: trade.userId.toString(),
            derivAccountId: trade.derivAccountId,
            brokerContractId: trade.brokerContractId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
    } catch (error) {
      console.error('[TradeMonitor] Error in monitor process:', error);
      summary.errors++;
    } finally {
      summary.finishedAt = new Date();
      summary.duration = summary.finishedAt.getTime() - summary.startedAt.getTime();
      console.log(`[TradeMonitor] Trade monitor completed | Duration: ${summary.duration}ms | Processed: ${summary.tradesProcessed} | Still Open: ${summary.tradesStillOpen} | Closed: ${summary.tradesClosed} | Errors: ${summary.errors}`);
    }
    
    return summary;
  }
  
  /**
   * Monitor a single copy trade
   */
  private async monitorSingleTrade(trade: any): Promise<MonitorResult> {
    const result: MonitorResult = {
      tradeId: trade._id.toString(),
      userId: trade.userId.toString(),
      derivAccountId: trade.derivAccountId,
      brokerContractId: trade.brokerContractId,
      success: false
    };
    
    // Safety check: Skip if broker contract ID is missing
    if (!trade.brokerContractId) {
      console.log(`[TradeMonitor] Skipping trade ${trade._id} - missing broker contract ID`);
      result.error = 'MISSING_BROKER_CONTRACT_ID';
      return result;
    }
    
    // Safety check: Re-verify trade is still OPEN (could have been closed by another run)
    const freshTrade = await CopyTrade.findById(trade._id);
    if (!freshTrade || freshTrade.status !== 'OPEN') {
      console.log(`[TradeMonitor] Trade ${trade._id} is no longer OPEN (status: ${freshTrade?.status})`);
      result.wasAlreadyClosed = true;
      result.success = true;
      result.status = freshTrade?.status as any;
      return result;
    }
    
    try {
      // Step 1: Get Deriv account and decrypt access token
      const derivAccount = await DerivAccount.findOne({ 
        derivAccountId: trade.derivAccountId 
      });
      
      if (!derivAccount) {
        throw new Error(`Deriv account not found: ${trade.derivAccountId}`);
      }
      
      // Step 2: Verify this is a demo account (safety check)
      if (derivAccount.accountType !== 'demo') {
        console.log(`[TradeMonitor] Skipping real account: ${trade.derivAccountId}`);
        result.error = 'REAL_ACCOUNT_NOT_SUPPORTED';
        return result;
      }
      
      // Step 3: Check if token is expired
      if (derivAccount.tokenExpiresAt < new Date()) {
        throw new Error('ACCESS_TOKEN_EXPIRED');
      }
      
      // Step 4: Decrypt the access token
      let accessToken: string;
      try {
        accessToken = decrypt(derivAccount.accessTokenEncrypted);
      } catch (error) {
        throw new Error('TOKEN_DECRYPTION_FAILED');
      }
      
      // Step 5: Create Deriv API client
      const apiClient = await createDerivApiClient(derivAccount.derivAccountId, accessToken, derivAccount.accountType);
      
      console.log(`[TradeMonitor] Checking Deriv contract: ${trade.brokerContractId}`);
      
      // Step 6: Query Deriv for current contract state
      const contractInfo = await apiClient.getOpenContract(trade.brokerContractId);
      
      // Step 7: Determine if contract is still open or closed
      const isSold = contractInfo.is_sold;
      const currentProfit = contractInfo.profit;
      
      console.log(`[TradeMonitor] Contract state: is_sold=${isSold}, profit=${currentProfit}`);
      
      if (isSold) {
        // Contract is closed
        console.log(`[TradeMonitor] Trade ${trade._id} closed by broker, final P/L: ${currentProfit}`);
        
        await CopyTrade.findByIdAndUpdate(trade._id, {
          status: 'CLOSED',
          profitLoss: currentProfit,
          closedAt: new Date(),
          updatedAt: new Date()
        });
        
        result.success = true;
        result.status = 'CLOSED';
        result.profitLoss = currentProfit;
        
      } else {
        // Contract is still open - update floating P/L
        console.log(`[TradeMonitor] Trade ${trade._id} still open, floating P/L: ${currentProfit}`);
        
        await CopyTrade.findByIdAndUpdate(trade._id, {
          profitLoss: currentProfit,
          updatedAt: new Date()
        });
        
        result.success = true;
        result.status = 'OPEN';
        result.profitLoss = currentProfit;
      }
      
      // Step 8: Disconnect API client
      apiClient.disconnect();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[TradeMonitor] Failed to monitor trade ${trade._id}: ${errorMessage}`);
      
      // IMPORTANT: Do NOT mark the trade as CLOSED on error
      // Keep the last known state and record the error
      result.error = errorMessage;
      
      // We could optionally record the monitoring error in the trade document
      // if we add a field like lastMonitorError, but for now we just log it
    }
    
    return result;
  }
}

// Export singleton instance
export const tradeMonitorService = new TradeMonitorService();

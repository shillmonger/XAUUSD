/**
 * Unit tests for Deriv Adapter Service
 * Tests the core functionality with mocked Deriv API responses
 */

import { DerivAdapter, InternalTradeRequest } from '../deriv-adapter.service';
import DerivAccount from '@/models/DerivAccount';
import CopyTrade from '@/models/CopyTrade';
import { decrypt } from '@/lib/encryption';

// Mock the dependencies
jest.mock('@/models/DerivAccount');
jest.mock('@/models/CopyTrade');
jest.mock('@/lib/encryption');
jest.mock('../deriv-api-client.service');
jest.mock('../deriv-symbol-mapper.service');

describe('DerivAdapter', () => {
  let derivAdapter: DerivAdapter;
  let mockTradeRequest: InternalTradeRequest;

  beforeEach(() => {
    derivAdapter = new DerivAdapter();
    mockTradeRequest = {
      signalId: '507f1f77bcf86cd799439011',
      userId: '507f1f77bcf86cd799439012',
      derivAccountId: 'CR123456',
      symbol: 'XAUUSD',
      direction: 'BUY',
      orderType: 'LIMIT',
      entry: 4072,
      stopLoss: 3072,
      takeProfit: 4090,
      lotSize: 5
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('executeTrade', () => {
    it('should successfully execute a trade for a valid demo account', async () => {
      // Mock DerivAccount.find
      (DerivAccount.findOne as jest.Mock).mockResolvedValue({
        derivAccountId: 'CR123456',
        accountType: 'demo',
        connectionStatus: 'connected',
        botStatus: 'ACTIVE',
        tokenExpiresAt: new Date(Date.now() + 3600000),
        accessTokenEncrypted: 'encrypted_token'
      });

      // Mock decrypt
      (decrypt as jest.Mock).mockReturnValue('decrypted_access_token');

      // Mock CopyTrade.findOne for duplicate check
      (CopyTrade.findOne as jest.Mock).mockResolvedValue(null);

      // Mock CopyTrade.save
      (CopyTrade.prototype.save as jest.Mock).mockResolvedValue({});

      // Mock the API client methods
      const mockApiClient = {
        getProposal: jest.fn().mockResolvedValue({
          id: 'proposal_123',
          ask_price: 100,
          payout: 110,
          spot: 4072
        }),
        buy: jest.fn().mockResolvedValue({
          contract_id: 'contract_456',
          buy_price: 100,
          payout: 110,
          transaction_id: 789
        }),
        updateContract: jest.fn().mockResolvedValue({}),
        disconnect: jest.fn()
      };

      // Mock createDerivApiClient
      const { createDerivApiClient } = require('../deriv-api-client.service');
      createDerivApiClient.mockResolvedValue(mockApiClient);

      // Mock symbol mapper
      const { derivSymbolMapper } = require('../deriv-symbol-mapper.service');
      derivSymbolMapper.verifySymbolMapping.mockResolvedValue({
        internalSymbol: 'XAUUSD',
        derivSymbol: 'frxXAUUSD',
        underlyingSymbolName: 'XAU/USD',
        market: 'forex',
        verified: true,
        verifiedAt: new Date()
      });

      const result = await derivAdapter.executeTrade(mockTradeRequest);

      expect(result.success).toBe(true);
      expect(result.broker).toBe('deriv');
      expect(result.brokerContractId).toBe('contract_456');
      expect(result.brokerTransactionId).toBe('789');
      expect(result.status).toBe('OPEN');
    });

    it('should reject real accounts', async () => {
      // Mock DerivAccount.find with real account
      (DerivAccount.findOne as jest.Mock).mockResolvedValue({
        derivAccountId: 'CR123456',
        accountType: 'real', // Real account
        connectionStatus: 'connected',
        botStatus: 'ACTIVE',
        tokenExpiresAt: new Date(Date.now() + 3600000),
        accessTokenEncrypted: 'encrypted_token'
      });

      const result = await derivAdapter.executeTrade(mockTradeRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('EXECUTION_BLOCKED_REAL_ACCOUNT_NOT_SUPPORTED');
      expect(result.errorCode).toBe('EXECUTION_BLOCKED_REAL_ACCOUNT_NOT_SUPPORTED');
    });

    it('should reject disconnected accounts', async () => {
      // Mock DerivAccount.find with disconnected account
      (DerivAccount.findOne as jest.Mock).mockResolvedValue({
        derivAccountId: 'CR123456',
        accountType: 'demo',
        connectionStatus: 'disconnected', // Disconnected
        botStatus: 'ACTIVE',
        tokenExpiresAt: new Date(Date.now() + 3600000),
        accessTokenEncrypted: 'encrypted_token'
      });

      const result = await derivAdapter.executeTrade(mockTradeRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('ACCOUNT_NOT_CONNECTED');
    });

    it('should reject accounts with inactive bot', async () => {
      // Mock DerivAccount.find with inactive bot
      (DerivAccount.findOne as jest.Mock).mockResolvedValue({
        derivAccountId: 'CR123456',
        accountType: 'demo',
        connectionStatus: 'connected',
        botStatus: 'OFF', // Inactive bot
        tokenExpiresAt: new Date(Date.now() + 3600000),
        accessTokenEncrypted: 'encrypted_token'
      });

      const result = await derivAdapter.executeTrade(mockTradeRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('BOT_NOT_ACTIVE');
    });

    it('should prevent duplicate execution', async () => {
      // Mock DerivAccount.find
      (DerivAccount.findOne as jest.Mock).mockResolvedValue({
        derivAccountId: 'CR123456',
        accountType: 'demo',
        connectionStatus: 'connected',
        botStatus: 'ACTIVE',
        tokenExpiresAt: new Date(Date.now() + 3600000),
        accessTokenEncrypted: 'encrypted_token'
      });

      // Mock CopyTrade.findOne to return existing trade (duplicate)
      (CopyTrade.findOne as jest.Mock).mockResolvedValue({
        signalId: mockTradeRequest.signalId,
        userId: mockTradeRequest.userId,
        derivAccountId: mockTradeRequest.derivAccountId,
        status: 'OPEN'
      });

      const result = await derivAdapter.executeTrade(mockTradeRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('DUPLICATE_EXECUTION');
      expect(result.errorCode).toBe('DUPLICATE_EXECUTION');
    });

    it('should handle token expiration', async () => {
      // Mock DerivAccount.find with expired token
      (DerivAccount.findOne as jest.Mock).mockResolvedValue({
        derivAccountId: 'CR123456',
        accountType: 'demo',
        connectionStatus: 'connected',
        botStatus: 'ACTIVE',
        tokenExpiresAt: new Date(Date.now() - 3600000), // Expired
        accessTokenEncrypted: 'encrypted_token'
      });

      const result = await derivAdapter.executeTrade(mockTradeRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('ACCESS_TOKEN_EXPIRED');
    });

    it('should handle token decryption failure', async () => {
      // Mock DerivAccount.find
      (DerivAccount.findOne as jest.Mock).mockResolvedValue({
        derivAccountId: 'CR123456',
        accountType: 'demo',
        connectionStatus: 'connected',
        botStatus: 'ACTIVE',
        tokenExpiresAt: new Date(Date.now() + 3600000),
        accessTokenEncrypted: 'encrypted_token'
      });

      // Mock decrypt to throw error
      (decrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const result = await derivAdapter.executeTrade(mockTradeRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('TOKEN_DECRYPTION_FAILED');
    });

    it('should handle proposal failure', async () => {
      // Mock DerivAccount.find
      (DerivAccount.findOne as jest.Mock).mockResolvedValue({
        derivAccountId: 'CR123456',
        accountType: 'demo',
        connectionStatus: 'connected',
        botStatus: 'ACTIVE',
        tokenExpiresAt: new Date(Date.now() + 3600000),
        accessTokenEncrypted: 'encrypted_token'
      });

      // Mock decrypt
      (decrypt as jest.Mock).mockReturnValue('decrypted_access_token');

      // Mock CopyTrade.findOne for duplicate check
      (CopyTrade.findOne as jest.Mock).mockResolvedValue(null);

      // Mock CopyTrade.save
      (CopyTrade.prototype.save as jest.Mock).mockResolvedValue({});

      // Mock the API client to fail proposal
      const mockApiClient = {
        getProposal: jest.fn().mockRejectedValue(new Error('Proposal failed')),
        disconnect: jest.fn()
      };

      const { createDerivApiClient } = require('../deriv-api-client.service');
      createDerivApiClient.mockResolvedValue(mockApiClient);

      // Mock symbol mapper
      const { derivSymbolMapper } = require('../deriv-symbol-mapper.service');
      derivSymbolMapper.verifySymbolMapping.mockResolvedValue({
        internalSymbol: 'XAUUSD',
        derivSymbol: 'frxXAUUSD',
        underlyingSymbolName: 'XAU/USD',
        market: 'forex',
        verified: true,
        verifiedAt: new Date()
      });

      const result = await derivAdapter.executeTrade(mockTradeRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Proposal failed');
    });

    it('should handle buy failure', async () => {
      // Mock DerivAccount.find
      (DerivAccount.findOne as jest.Mock).mockResolvedValue({
        derivAccountId: 'CR123456',
        accountType: 'demo',
        connectionStatus: 'connected',
        botStatus: 'ACTIVE',
        tokenExpiresAt: new Date(Date.now() + 3600000),
        accessTokenEncrypted: 'encrypted_token'
      });

      // Mock decrypt
      (decrypt as jest.Mock).mockReturnValue('decrypted_access_token');

      // Mock CopyTrade.findOne for duplicate check
      (CopyTrade.findOne as jest.Mock).mockResolvedValue(null);

      // Mock CopyTrade.save
      (CopyTrade.prototype.save as jest.Mock).mockResolvedValue({});

      // Mock the API client to succeed proposal but fail buy
      const mockApiClient = {
        getProposal: jest.fn().mockResolvedValue({
          id: 'proposal_123',
          ask_price: 100,
          payout: 110,
          spot: 4072
        }),
        buy: jest.fn().mockRejectedValue(new Error('Buy failed')),
        disconnect: jest.fn()
      };

      const { createDerivApiClient } = require('../deriv-api-client.service');
      createDerivApiClient.mockResolvedValue(mockApiClient);

      // Mock symbol mapper
      const { derivSymbolMapper } = require('../deriv-symbol-mapper.service');
      derivSymbolMapper.verifySymbolMapping.mockResolvedValue({
        internalSymbol: 'XAUUSD',
        derivSymbol: 'frxXAUUSD',
        underlyingSymbolName: 'XAU/USD',
        market: 'forex',
        verified: true,
        verifiedAt: new Date()
      });

      const result = await derivAdapter.executeTrade(mockTradeRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Buy failed');
    });
  });

  describe('buildTradeRequest', () => {
    it('should build trade request from Phase 5/6 data', () => {
      const mockSignal = {
        _id: '507f1f77bcf86cd799439011',
        symbol: 'XAUUSD',
        direction: 'BUY',
        orderType: 'LIMIT',
        entry: 4072,
        stopLoss: 4065,
        takeProfits: [4080, 4090, 4150]
      };

      const mockTradeParameters = {
        finalStopLoss: 3072,
        finalTakeProfit: 4090,
        finalLotSize: 5
      };

      const mockUserEligibility = {
        userId: '507f1f77bcf86cd799439012',
        derivAccountId: 'CR123456'
      };

      const tradeRequest = DerivAdapter.buildTradeRequest(
        mockSignal as any,
        mockTradeParameters as any,
        mockUserEligibility as any
      );

      expect(tradeRequest.signalId).toBe('507f1f77bcf86cd799439011');
      expect(tradeRequest.userId).toBe('507f1f77bcf86cd799439012');
      expect(tradeRequest.derivAccountId).toBe('CR123456');
      expect(tradeRequest.symbol).toBe('XAUUSD');
      expect(tradeRequest.direction).toBe('BUY');
      expect(tradeRequest.orderType).toBe('LIMIT');
      expect(tradeRequest.entry).toBe(4072);
      expect(tradeRequest.stopLoss).toBe(3072); // Final SL from Phase 5
      expect(tradeRequest.takeProfit).toBe(4090); // Final TP from Phase 5
      expect(tradeRequest.lotSize).toBe(5); // Final lot size from Phase 5
    });
  });
});

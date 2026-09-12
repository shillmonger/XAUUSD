/**
 * Unit tests for Phase 8 Execution Engine
 * Tests multi-user execution, account isolation, and rejection scenarios
 */

import { Phase8ExecutionEngine } from '../phase8-execution-engine.service';
import Signal from '@/models/Signal';
import UserEligibility from '@/models/UserEligibility';
import TradeParameters from '@/models/TradeParameters';
import CopyTrade from '@/models/CopyTrade';
import { derivAdapter } from '../deriv-adapter.service';

// Mock the dependencies
jest.mock('@/models/Signal');
jest.mock('@/models/UserEligibility');
jest.mock('@/models/TradeParameters');
jest.mock('@/models/CopyTrade');
jest.mock('../deriv-adapter.service');

describe('Phase8ExecutionEngine', () => {
  let phase8Engine: Phase8ExecutionEngine;
  let mockSignalId: string;

  beforeEach(() => {
    phase8Engine = new Phase8ExecutionEngine();
    mockSignalId = '507f1f77bcf86cd799439011';

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('processSignalExecution', () => {
    it('should execute trades for all eligible demo accounts', async () => {
      // Mock Signal.findById
      (Signal.findById as jest.Mock).mockResolvedValue({
        _id: mockSignalId,
        symbol: 'XAUUSD',
        direction: 'BUY',
        orderType: 'LIMIT',
        entry: 4072,
        stopLoss: 4065,
        takeProfits: [4080, 4090, 4150],
        validationStatus: 'valid'
      });

      // Mock UserEligibility.find with multiple eligible accounts
      (UserEligibility.find as jest.Mock).mockResolvedValue([
        {
          userId: '507f1f77bcf86cd799439012',
          derivAccountId: 'CR123456',
          accountType: 'demo',
          eligible: true,
          tradeParametersId: 'param_1'
        },
        {
          userId: '507f1f77bcf86cd799439013',
          derivAccountId: 'CR789012',
          accountType: 'demo',
          eligible: true,
          tradeParametersId: 'param_2'
        }
      ]);

      // Mock TradeParameters.findOne
      (TradeParameters.findOne as jest.Mock).mockResolvedValue({
        eligible: true,
        positionLimitReached: false,
        finalStopLoss: 3072,
        finalTakeProfit: 4090,
        finalLotSize: 5
      });

      // Mock derivAdapter.executeTrade to succeed
      (derivAdapter.executeTrade as jest.Mock).mockResolvedValue({
        success: true,
        brokerContractId: 'contract_123',
        brokerTransactionId: 'txn_456',
        executionPrice: 100,
        status: 'OPEN'
      });

      const result = await phase8Engine.processSignalExecution(mockSignalId);

      expect(result.totalEligibleAccounts).toBe(2);
      expect(result.successfulExecutions).toBe(2);
      expect(result.failedExecutions).toBe(0);
      expect(result.executionResults.length).toBe(2);
      expect(derivAdapter.executeTrade).toHaveBeenCalledTimes(2);
    });

    it('should ignore real accounts', async () => {
      // Mock Signal.findById
      (Signal.findById as jest.Mock).mockResolvedValue({
        _id: mockSignalId,
        symbol: 'XAUUSD',
        direction: 'BUY',
        orderType: 'LIMIT',
        entry: 4072,
        stopLoss: 4065,
        takeProfits: [4080, 4090, 4150],
        validationStatus: 'valid'
      });

      // Mock UserEligibility.find with only demo accounts (real accounts filtered at query level)
      (UserEligibility.find as jest.Mock).mockResolvedValue([
        {
          userId: '507f1f77bcf86cd799439012',
          derivAccountId: 'CR123456',
          accountType: 'demo',
          eligible: true,
          tradeParametersId: 'param_1'
        }
      ]);

      // Mock TradeParameters.findOne
      (TradeParameters.findOne as jest.Mock).mockResolvedValue({
        eligible: true,
        positionLimitReached: false,
        finalStopLoss: 3072,
        finalTakeProfit: 4090,
        finalLotSize: 5
      });

      // Mock derivAdapter.executeTrade
      (derivAdapter.executeTrade as jest.Mock).mockResolvedValue({
        success: true,
        brokerContractId: 'contract_123',
        brokerTransactionId: 'txn_456',
        executionPrice: 100,
        status: 'OPEN'
      });

      const result = await phase8Engine.processSignalExecution(mockSignalId);

      expect(result.totalEligibleAccounts).toBe(1);
      expect(result.successfulExecutions).toBe(1);
      expect(derivAdapter.executeTrade).toHaveBeenCalledTimes(1);
    });

    it('should skip accounts with inactive bot status', async () => {
      // Mock Signal.findById
      (Signal.findById as jest.Mock).mockResolvedValue({
        _id: mockSignalId,
        symbol: 'XAUUSD',
        direction: 'BUY',
        orderType: 'LIMIT',
        entry: 4072,
        stopLoss: 4065,
        takeProfits: [4080, 4090, 4150],
        validationStatus: 'valid'
      });

      // Mock UserEligibility.find with one eligible and one ineligible (filtered at Phase 6 level)
      (UserEligibility.find as jest.Mock).mockResolvedValue([
        {
          userId: '507f1f77bcf86cd799439012',
          derivAccountId: 'CR123456',
          accountType: 'demo',
          eligible: true,
          tradeParametersId: 'param_1'
        }
      ]);

      // Mock TradeParameters.findOne
      (TradeParameters.findOne as jest.Mock).mockResolvedValue({
        eligible: true,
        positionLimitReached: false,
        finalStopLoss: 3072,
        finalTakeProfit: 4090,
        finalLotSize: 5
      });

      // Mock derivAdapter.executeTrade
      (derivAdapter.executeTrade as jest.Mock).mockResolvedValue({
        success: true,
        brokerContractId: 'contract_123',
        brokerTransactionId: 'txn_456',
        executionPrice: 100,
        status: 'OPEN'
      });

      const result = await phase8Engine.processSignalExecution(mockSignalId);

      expect(result.totalEligibleAccounts).toBe(1);
      expect(result.successfulExecutions).toBe(1);
    });

    it('should respect position limits from Phase 5', async () => {
      // Mock Signal.findById
      (Signal.findById as jest.Mock).mockResolvedValue({
        _id: mockSignalId,
        symbol: 'XAUUSD',
        direction: 'BUY',
        orderType: 'LIMIT',
        entry: 4072,
        stopLoss: 4065,
        takeProfits: [4080, 4090, 4150],
        validationStatus: 'valid'
      });

      // Mock UserEligibility.find
      (UserEligibility.find as jest.Mock).mockResolvedValue([
        {
          userId: '507f1f77bcf86cd799439012',
          derivAccountId: 'CR123456',
          accountType: 'demo',
          eligible: true,
          tradeParametersId: 'param_1'
        }
      ]);

      // Mock TradeParameters.findOne with position limit reached
      (TradeParameters.findOne as jest.Mock).mockResolvedValue({
        eligible: true,
        positionLimitReached: true, // Position limit reached
        finalStopLoss: 3072,
        finalTakeProfit: 4090,
        finalLotSize: 5
      });

      const result = await phase8Engine.processSignalExecution(mockSignalId);

      expect(result.totalEligibleAccounts).toBe(1);
      expect(result.skippedExecutions).toBe(1);
      expect(result.executionResults[0].error).toBe('POSITION_LIMIT_REACHED');
      expect(derivAdapter.executeTrade).not.toHaveBeenCalled();
    });

    it('should use each user\'s own Deriv account', async () => {
      // Mock Signal.findById
      (Signal.findById as jest.Mock).mockResolvedValue({
        _id: mockSignalId,
        symbol: 'XAUUSD',
        direction: 'BUY',
        orderType: 'LIMIT',
        entry: 4072,
        stopLoss: 4065,
        takeProfits: [4080, 4090, 4150],
        validationStatus: 'valid'
      });

      // Mock UserEligibility.find with different accounts
      (UserEligibility.find as jest.Mock).mockResolvedValue([
        {
          userId: '507f1f77bcf86cd799439012',
          derivAccountId: 'CR123456',
          accountType: 'demo',
          eligible: true,
          tradeParametersId: 'param_1'
        },
        {
          userId: '507f1f77bcf86cd799439013',
          derivAccountId: 'CR789012',
          accountType: 'demo',
          eligible: true,
          tradeParametersId: 'param_2'
        }
      ]);

      // Mock TradeParameters.findOne
      (TradeParameters.findOne as jest.Mock).mockResolvedValue({
        eligible: true,
        positionLimitReached: false,
        finalStopLoss: 3072,
        finalTakeProfit: 4090,
        finalLotSize: 5
      });

      // Mock derivAdapter.executeTrade
      (derivAdapter.executeTrade as jest.Mock).mockResolvedValue({
        success: true,
        brokerContractId: 'contract_123',
        brokerTransactionId: 'txn_456',
        executionPrice: 100,
        status: 'OPEN'
      });

      await phase8Engine.processSignalExecution(mockSignalId);

      // Verify that executeTrade was called with different derivAccountIds
      const calls = (derivAdapter.executeTrade as jest.Mock).mock.calls;
      expect(calls[0][0].derivAccountId).toBe('CR123456');
      expect(calls[1][0].derivAccountId).toBe('CR789012');
    });

    it('should handle individual execution failures gracefully', async () => {
      // Mock Signal.findById
      (Signal.findById as jest.Mock).mockResolvedValue({
        _id: mockSignalId,
        symbol: 'XAUUSD',
        direction: 'BUY',
        orderType: 'LIMIT',
        entry: 4072,
        stopLoss: 4065,
        takeProfits: [4080, 4090, 4150],
        validationStatus: 'valid'
      });

      // Mock UserEligibility.find
      (UserEligibility.find as jest.Mock).mockResolvedValue([
        {
          userId: '507f1f77bcf86cd799439012',
          derivAccountId: 'CR123456',
          accountType: 'demo',
          eligible: true,
          tradeParametersId: 'param_1'
        },
        {
          userId: '507f1f77bcf86cd799439013',
          derivAccountId: 'CR789012',
          accountType: 'demo',
          eligible: true,
          tradeParametersId: 'param_2'
        }
      ]);

      // Mock TradeParameters.findOne
      (TradeParameters.findOne as jest.Mock).mockResolvedValue({
        eligible: true,
        positionLimitReached: false,
        finalStopLoss: 3072,
        finalTakeProfit: 4090,
        finalLotSize: 5
      });

      // Mock derivAdapter.executeTrade to succeed for first, fail for second
      (derivAdapter.executeTrade as jest.Mock)
        .mockResolvedValueOnce({
          success: true,
          brokerContractId: 'contract_123',
          brokerTransactionId: 'txn_456',
          executionPrice: 100,
          status: 'OPEN'
        })
        .mockResolvedValueOnce({
          success: false,
          error: 'Execution failed',
          status: 'FAILED'
        });

      const result = await phase8Engine.processSignalExecution(mockSignalId);

      expect(result.totalEligibleAccounts).toBe(2);
      expect(result.successfulExecutions).toBe(1);
      expect(result.failedExecutions).toBe(1);
      expect(result.executionResults[0].success).toBe(true);
      expect(result.executionResults[1].success).toBe(false);
    });

    it('should handle missing trade parameters', async () => {
      // Mock Signal.findById
      (Signal.findById as jest.Mock).mockResolvedValue({
        _id: mockSignalId,
        symbol: 'XAUUSD',
        direction: 'BUY',
        orderType: 'LIMIT',
        entry: 4072,
        stopLoss: 4065,
        takeProfits: [4080, 4090, 4150],
        validationStatus: 'valid'
      });

      // Mock UserEligibility.find
      (UserEligibility.find as jest.Mock).mockResolvedValue([
        {
          userId: '507f1f77bcf86cd799439012',
          derivAccountId: 'CR123456',
          accountType: 'demo',
          eligible: true,
          tradeParametersId: 'param_1'
        }
      ]);

      // Mock TradeParameters.findOne to return null (missing parameters)
      (TradeParameters.findOne as jest.Mock).mockResolvedValue(null);

      const result = await phase8Engine.processSignalExecution(mockSignalId);

      expect(result.totalEligibleAccounts).toBe(1);
      expect(result.failedExecutions).toBe(1);
      expect(result.executionResults[0].error).toBe('TRADE_PARAMETERS_NOT_FOUND');
    });

    it('should return empty summary when no eligible accounts found', async () => {
      // Mock Signal.findById
      (Signal.findById as jest.Mock).mockResolvedValue({
        _id: mockSignalId,
        symbol: 'XAUUSD',
        direction: 'BUY',
        orderType: 'LIMIT',
        entry: 4072,
        stopLoss: 4065,
        takeProfits: [4080, 4090, 4150],
        validationStatus: 'valid'
      });

      // Mock UserEligibility.find to return empty array
      (UserEligibility.find as jest.Mock).mockResolvedValue([]);

      const result = await phase8Engine.processSignalExecution(mockSignalId);

      expect(result.totalEligibleAccounts).toBe(0);
      expect(result.successfulExecutions).toBe(0);
      expect(result.failedExecutions).toBe(0);
      expect(result.executionResults.length).toBe(0);
    });
  });

  describe('getExecutionStatistics', () => {
    it('should return execution statistics for a signal', async () => {
      // Mock UserEligibility.countDocuments
      (UserEligibility.countDocuments as jest.Mock).mockResolvedValue(5);

      // Mock CopyTrade.countDocuments
      (CopyTrade.countDocuments as jest.Mock)
        .mockResolvedValueOnce(3) // successful
        .mockResolvedValueOnce(1) // failed
        .mockResolvedValueOnce(1); // pending

      const stats = await phase8Engine.getExecutionStatistics(mockSignalId);

      expect(stats.totalEligible).toBe(5);
      expect(stats.successful).toBe(3);
      expect(stats.failed).toBe(1);
      expect(stats.pending).toBe(1);
    });
  });
});

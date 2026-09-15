import { MT5ExecutionService } from '../services/mt5-execution.service';
import { TradeMonitorService } from '../services/trade-monitor.service';

describe('Deriv MT5/CFD migration', () => {
  it('validates an XAUUSD signal for the external MT5 EA bridge', () => {
    const signal = MT5ExecutionService.convertToMT5Signal(
      'signal-1', 'user-1', '123456', 'Deriv-Demo', 'demo',
      'XAUUSD', 'BUY', 2450, 2445, 2470, 1
    );

    const request = MT5ExecutionService.prepareExecutionRequest(signal);
    const validation = MT5ExecutionService.validateMT5Signal(signal);

    expect(validation.valid).toBe(true);
    expect(request.action).toBe('open_position');
    expect(request.symbol).toBe('XAUUSD');
    expect(request.mt5Login).toBe('123456');
    expect(request.side).toBe('BUY');
  });

  it('rejects non-XAUUSD signals before they reach the EA queue', () => {
    const signal = MT5ExecutionService.convertToMT5Signal(
      'signal-2', 'user-1', '123456', 'Deriv-Demo', 'demo',
      'EURUSD', 'SELL', 1.1, 1.11, 1.08, 1
    );

    const validation = MT5ExecutionService.validateMT5Signal(signal);

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Only XAUUSD CFD is supported for Deriv MT5 execution');
  });

  it('does not emit Options or Multipliers execution payloads', () => {
    const signal = MT5ExecutionService.convertToMT5Signal(
      'signal-3', 'user-1', '123456', 'Deriv-Demo', 'demo',
      'XAUUSD', 'SELL', 2450, 2460, 2425, 1
    );

    const request = MT5ExecutionService.prepareExecutionRequest(signal);

    expect(JSON.stringify(request)).not.toMatch(/MULTUP|MULTDOWN|proposal|options_accounts/i);
  });

  it('keeps monitoring explicit until the EA reports a position ID', async () => {
    const monitor = new TradeMonitorService() as any;
    const result = await monitor.monitorSingleTrade({
      _id: { toString: () => 'trade-1' },
      userId: { toString: () => 'user-1' },
      derivAccountId: '123456',
      mt5PositionId: undefined,
      status: 'OPEN',
    });

    expect(result.status).toBe('OPEN');
    expect(result.error).toBe('MISSING_MT5_POSITION_ID');
  });
});

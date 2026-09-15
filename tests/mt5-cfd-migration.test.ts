import {
  createDerivMT5Service,
  isSupportedMT5CFDAccount,
  resolveDerivAppId,
} from '../services/deriv-mt5.service';
import { MT5ExecutionService } from '../services/mt5-execution.service';
import { TradeMonitorService } from '../services/trade-monitor.service';

describe('Deriv MT5/CFD migration', () => {
  it('accepts a valid MT5 demo account connection', () => {
    const service: any = createDerivMT5Service('token', '1234');
    const account = service.mapRawAccount({
      login: '123456',
      server: 'Deriv-Demo',
      account_type: 'demo',
      currency: 'USD',
      balance: '9950.00',
      status: 'active',
      company: 'Deriv',
      name: 'Test Demo',
      equity: '10000',
      margin: '250',
      free_margin: '9750',
      margin_level: '4000',
      group: 'demo',
    });

    expect(account.accountType).toBe('demo');
    expect(account.balance).toBe(9950);
    expect(isSupportedMT5CFDAccount(account)).toBe(true);
  });

  it('rejects Options and Multipliers account connections', () => {
    expect(isSupportedMT5CFDAccount({ login: 'DOT94272941', server: 'Options-Demo', accountType: 'demo' })).toBe(false);
    expect(isSupportedMT5CFDAccount({ login: 'MULT94272941', server: 'Multipliers', accountType: 'demo' })).toBe(false);
    expect(isSupportedMT5CFDAccount({ login: '', server: 'Deriv-Demo', accountType: 'demo' })).toBe(false);
  });

  it('reads the MT5 balance from the CFD account settings', () => {
    const service: any = createDerivMT5Service('token', '1234');
    const settings = service.mapRawAccountSettings({
      login: '123456',
      server: 'Deriv-Demo',
      account_type: 'demo',
      currency: 'USD',
      balance: '9995.00',
      status: 'active',
      company: 'Deriv',
      name: 'Test Demo',
      equity: '10010.00',
      margin: '100.00',
      free_margin: '9900.00',
      margin_level: '10000.00',
      group: 'demo',
    });

    expect(settings.balance).toBe(9995);
    expect(settings.currency).toBe('USD');
    expect(settings.accountStatus).toBe('active');
  });

  it('requires a dedicated Deriv MT5 app ID and rejects OAuth client ID as the WebSocket app', () => {
    expect(resolveDerivAppId({ DERIV_APP_ID: '5678' } as any)).toBe('5678');

    expect(() => resolveDerivAppId({ DERIV_CLIENT_ID: '1234' } as any)).toThrow(
      /DERIV_APP_ID.*MT5\/CFD WebSocket app ID/i
    );
  });

  it('routes XAUUSD signals to the MT5/CFD execution layer', () => {
    const signal = MT5ExecutionService.convertToMT5Signal(
      'signal-1',
      'user-1',
      '123456',
      'Deriv-Demo',
      'demo',
      'XAUUSD',
      'BUY',
      2450,
      2445,
      2470,
      1
    );

    const request = MT5ExecutionService.prepareExecutionRequest(signal);

    expect(signal.symbol).toBe('XAUUSD');
    expect(request.action).toBe('open_position');
    expect(request.symbol).toBe('XAUUSD');
    expect(request.mt5Login).toBe('123456');
    expect(request.side).toBe('BUY');
    expect(JSON.stringify(request)).not.toMatch(/MULTUP|MULTDOWN|proposal|options_accounts/i);
  });

  it('blocks any attempted Options execution path', () => {
    const request = MT5ExecutionService.prepareExecutionRequest({
      signalId: 'signal-2',
      userId: 'user-2',
      mt5Login: '123456',
      mt5Server: 'Deriv-Demo',
      accountType: 'demo',
      symbol: 'XAUUSD',
      side: 'SELL',
      volume: 0.01,
      stopLoss: 2440,
      takeProfit: 2425,
      createdAt: new Date(),
      status: 'pending',
      source: 'telegram_signal',
    });

    expect(request.action).toBe('open_position');
    expect(JSON.stringify(request)).not.toContain('MULTUP');
    expect(JSON.stringify(request)).not.toContain('MULTDOWN');
    expect(JSON.stringify(request)).not.toContain('proposal');
  });

  it('keeps MT5/CFD trade monitoring status explicit', async () => {
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

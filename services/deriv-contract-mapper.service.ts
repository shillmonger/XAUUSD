/**
 * REMOVED — Deriv Options Contract Mapper
 *
 * This file has been moved to:
 *   services/_deprecated_options/deriv-contract-mapper.service.ts
 *
 * It MUST NOT be used in the active trading path.
 * It mapped: BUY -> MULTUP, SELL -> MULTDOWN
 *
 * In the MT5/CFD path, direction is represented directly as 'BUY' | 'SELL'
 * in the MT5TradeSignal interface (services/mt5-execution.service.ts).
 * No contract-type mapping is needed or permitted.
 */
throw new Error(
  '[deriv-contract-mapper.service] This Options contract mapper has been removed. ' +
  'MT5/CFD uses BUY/SELL directly — no MULTUP/MULTDOWN mapping exists.'
);

export {};

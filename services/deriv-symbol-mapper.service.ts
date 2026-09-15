/**
 * REMOVED — Deriv Options Symbol Mapper
 *
 * This file has been moved to:
 *   services/_deprecated_options/deriv-symbol-mapper.service.ts
 *
 * It MUST NOT be used in the active trading path.
 * It mapped internal asset names (XAUUSD) to Deriv Options symbols (frxXAUUSD, etc.)
 * for use with the Options contracts_for API.
 *
 * In the MT5/CFD path, XAUUSD is used directly as the MT5 symbol.
 * Symbol conversion is handled inside:
 *   services/mt5-execution.service.ts -> convertAssetToMT5Symbol()
 */
throw new Error(
  '[deriv-symbol-mapper.service] This Options symbol mapper has been removed. ' +
  'MT5 symbol mapping is in mt5-execution.service.ts -> convertAssetToMT5Symbol().'
);

export {};

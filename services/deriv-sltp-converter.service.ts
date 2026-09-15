/**
 * REMOVED — Deriv Options SL/TP Converter
 *
 * This file has been moved to:
 *   services/_deprecated_options/deriv-sltp-converter.service.ts
 *
 * It MUST NOT be used in the active trading path.
 * It converted SL/TP values for Options/Multipliers contract format.
 *
 * In the MT5/CFD path, SL/TP are used directly as price levels
 * (e.g. stopLoss: 1800.00, takeProfit: 1900.00 for XAUUSD)
 * without any Options-specific conversion.
 * See: services/mt5-execution.service.ts
 */
throw new Error(
  '[deriv-sltp-converter.service] This Options SL/TP converter has been removed. ' +
  'MT5/CFD uses price-level SL/TP directly. See mt5-execution.service.ts.'
);

export {};

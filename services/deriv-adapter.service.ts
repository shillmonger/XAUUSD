/**
 * REMOVED — Deriv Options/Multipliers Adapter
 *
 * This file has been moved to:
 *   services/_deprecated_options/deriv-adapter.service.ts
 *
 * It MUST NOT be used in the active trading path.
 * It contained MULTUP / MULTDOWN / proposal / buy logic for Deriv Options.
 *
 * For MT5/CFD trade execution, use:
 *   services/mt5-adapter.service.ts
 */
throw new Error(
  '[deriv-adapter.service] This Options/Multipliers service has been removed. ' +
  'Use mt5-adapter.service.ts for MT5/CFD trade execution.'
);

export {};

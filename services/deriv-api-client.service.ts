/**
 * REMOVED — Deriv Options API Client
 *
 * This file has been moved to:
 *   services/_deprecated_options/deriv-api-client.service.ts
 *
 * It MUST NOT be used in the active trading path.
 * It contained:
 *   - OTP authentication via https://api.derivws.com/trading/v1/options/accounts/{id}/otp
 *   - getProposal() for Options/Multipliers contracts
 *   - buy() for Options/Multipliers contracts
 *   - checkAssetAvailabilityForMultipliers()
 *   - validateMultiplierContracts()
 *
 * For MT5/CFD account management, use:
 *   services/mt5-adapter.service.ts
 */
throw new Error(
  '[deriv-api-client.service] This Options/Multipliers API client has been removed. ' +
  'Use the MT5 EA bridge for MT5/CFD account management and execution.'
);

export {};

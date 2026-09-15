/**
 * REMOVED — Deriv Options WebSocket Client
 *
 * This file has been moved to:
 *   services/_deprecated_options/deriv-websocket-client.service.ts
 *
 * It MUST NOT be used in the active trading path.
 * It connected to:
 *   wss://api.derivws.com/trading/v1/options/ws/demo?otp=<OTP>
 * which is the Deriv Options trading WebSocket — NOT the MT5 endpoint.
 *
 * MT5/CFD account and trade operations are handled by the external MT5 EA.
 */
throw new Error(
  '[deriv-websocket-client.service] Deriv Options WebSocket support has been removed. ' +
  'MT5/CFD execution is handled by the external EA bridge.'
);

export {};

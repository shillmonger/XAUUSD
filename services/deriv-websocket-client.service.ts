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
 * For MT5/CFD operations, the correct WebSocket is used inside:
 *   services/deriv-mt5.service.ts
 * which connects to:
 *   wss://ws.derivws.com/websockets/v3?app_id=<APP_ID>
 */
throw new Error(
  '[deriv-websocket-client.service] This Options WebSocket client has been removed. ' +
  'MT5/CFD WebSocket logic is in deriv-mt5.service.ts.'
);

export {};

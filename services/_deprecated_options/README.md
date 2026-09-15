# DEPRECATED — Deriv Options / Multipliers Services

These files are ARCHIVED and must NOT be imported anywhere in the active codebase.

They were used during an earlier phase when the application executed trades via the
Deriv Options/Multipliers WebSocket API (MULTUP / MULTDOWN contracts).

That execution path has been completely replaced by the MT5/CFD architecture.

## Files in this folder

| File | Was used for |
|---|---|
| deriv-adapter.service.ts | Options/Multipliers trade execution (MULTUP/MULTDOWN proposals + buy) |
| deriv-api-client.service.ts | Options WebSocket client wrapper; OTP auth via options/accounts/{id}/otp |
| deriv-websocket-client.service.ts | Raw WebSocket to api.derivws.com/trading/v1/options/ws/demo |
| deriv-contract-mapper.service.ts | Maps BUY to MULTUP, SELL to MULTDOWN |
| deriv-symbol-mapper.service.ts | Maps internal asset names to Deriv Options symbols |
| deriv-sltp-converter.service.ts | Converts SL/TP for Options contracts |

## Active replacement services

| New file | Purpose |
|---|---|
| External MT5 EA bridge | MT5 account management and CFD execution |
| services/mt5-adapter.service.ts | MT5/CFD trade execution adapter |
| services/mt5-execution.service.ts | MT5 signal preparation and EA bridge interface |
| app/api/deriv/mt5/signals/route.ts | EA polling endpoint for pending signals |

## Do NOT reference these files

The active trading path never calls any file in this directory.
If you need to understand historical Options logic, read these files but do not import them.

# XAU PRIME — MT5/CFD Migration Status

> **Last updated:** September 2026
> **Status:** MIGRATION COMPLETE (pending MT5 Expert Advisor installation)

---

## Summary

The application has been fully migrated from **Deriv Options/Multipliers** to
**Deriv CFD / MT5 (XAUUSD automated copy trading)**.

Options and Multipliers trading is no longer used in any active code path.

---

## What Changed

### Removed / Isolated

| File | What it did | Where it is now |
|---|---|---|
| `services/deriv-adapter.service.ts` | MULTUP/MULTDOWN proposals + buy | `services/_deprecated_options/` (tombstone left) |
| `services/deriv-api-client.service.ts` | Options OTP auth + proposal/buy | `services/_deprecated_options/` (tombstone left) |
| `services/deriv-websocket-client.service.ts` | Options WebSocket | `services/_deprecated_options/` (tombstone left) |
| `services/deriv-contract-mapper.service.ts` | BUY→MULTUP mapping | `services/_deprecated_options/` (tombstone left) |
| `services/deriv-symbol-mapper.service.ts` | Options symbol mapper | `services/_deprecated_options/` (tombstone left) |
| `services/deriv-sltp-converter.service.ts` | Options SL/TP converter | `services/_deprecated_options/` (tombstone left) |
| `app/api/deriv/refresh/route.ts` | Called `options/accounts` REST API | **Replaced** with MT5 `mt5_get_settings` WebSocket |

### Added

| File | Purpose |
|---|---|
| `models/MT5SignalQueue.ts` | MongoDB model for EA signal queue |
| `app/api/deriv/mt5/signals/route.ts` | EA polling: GET pending signals, POST acknowledge |
| `app/api/deriv/mt5/signals/[signalId]/result/route.ts` | EA execution result callback |
| `app/api/admin/migrate-options-accounts/route.ts` | One-time migration: mark old Options records invalid |

### Already Correct (no changes needed)

| File | Status |
|---|---|
| `models/DerivAccount.ts` | Has `accountPlatform: 'mt5'`, `product: 'cfd'`, `mt5Login`, `mt5Server` |
| `models/CopyTrade.ts` | Has MT5 fields; Options fields marked deprecated |
| `app/api/deriv/callback/route.ts` | Uses MT5 service; rejects Options accounts |
| `app/api/deriv/status/route.ts` | Verifies `accountPlatform === 'mt5'`; marks old accounts invalid |
| `app/api/deriv/connect/route.ts` | PKCE OAuth; no Options logic |
| `app/UserDashboard/connect-deriv/page.tsx` | Says "Connect Deriv CFD / MT5 Account"; warns Options not supported |
| `services/deriv-mt5.service.ts` | MT5 account management via official WebSocket API |
| `services/mt5-adapter.service.ts` | MT5/CFD execution adapter (now with real queue) |
| `services/mt5-execution.service.ts` | MT5 signal conversion + real queue operations |
| `services/phase8-execution-engine.service.ts` | Wired to MT5Adapter; no Options logic |

---

## Architecture

```
Telegram
  → Signal Collector (cron)
  → AI Parser (ai/ folder)
  → Signal Validation
  → Trade Parameter Resolver (Phase 5)
  → User Eligibility (Phase 6)
  → Phase 8 Execution Engine
  → MT5Adapter.executeTrade()
      → Verify MT5/CFD account
      → Create CopyTrade (PENDING)
      → Convert to MT5TradeSignal
      → Persist to MT5SignalQueue (MongoDB)
      → Update CopyTrade (SENT_TO_MT5)

MT5 Expert Advisor (external — NOT YET INSTALLED)
  → Poll GET /api/deriv/mt5/signals?mt5Login=<login>&status=pending
  → Execute XAUUSD CFD position in user's MT5 account
  → Report back POST /api/deriv/mt5/signals/[signalId]/result
  → Backend updates CopyTrade to OPEN with positionId and fill price
```

---

## EA Integration — PENDING COMPONENT

**This is the only remaining missing component.**

The backend is fully prepared. The MT5 Expert Advisor is not yet installed.

### What the EA must do

1. Authenticate with `x-ea-api-key: <MT5_EA_API_KEY>` header.
2. Call `GET /api/deriv/mt5/signals?mt5Login=<login>&status=pending` on a schedule (e.g. every 5 seconds).
3. For each signal, check `expiresAt` — skip expired signals.
4. Open a `XAUUSD` CFD market order in the user's MT5 demo account with the signal's `side`, `volume`, `stopLoss`, `takeProfit`.
5. Report the result back to `POST /api/deriv/mt5/signals/[signalId]/result`.

### Signal payload the EA receives

```json
{
  "signalId": "...",
  "symbol": "XAUUSD",
  "side": "BUY",
  "volume": 0.01,
  "entryPrice": null,
  "stopLoss": 1800.00,
  "takeProfit": 1900.00,
  "accountType": "demo",
  "mt5Server": "Deriv-Demo",
  "expiresAt": "2026-09-15T20:30:00.000Z"
}
```

### Result payload the EA sends back

```json
{
  "success": true,
  "positionId": "123456789",
  "executionPrice": 1850.25
}
```

or on failure:

```json
{
  "success": false,
  "error": "No quote available for XAUUSD"
}
```

---

## Environment Variables Required

| Variable | Purpose |
|---|---|
| `MT5_EA_API_KEY` | Shared secret between backend and MT5 EA |
| `ADMIN_API_KEY` | Admin route authentication |
| `DERIV_CLIENT_ID` | Deriv OAuth App ID |
| `DERIV_CLIENT_SECRET` | Deriv OAuth client secret |
| `DERIV_REDIRECT_URI` | Must match Deriv app settings |

---

## One-Time Migration Step

After deploying this version, run:

```bash
curl -X POST https://xauprime.vercel.app/api/admin/migrate-options-accounts \
  -H "x-admin-api-key: <ADMIN_API_KEY>"
```

This marks all legacy Options account records as `connectionStatus: 'invalid'`.
Users will see a prompt to reconnect their Deriv MT5/CFD account.

---

## Testing (Demo Account)

1. Log in to your Deriv account at https://app.deriv.com
2. Ensure you have an MT5 demo account: Trader's Hub → Deriv MT5 → Demo
3. Connect at https://xauprime.vercel.app/UserDashboard/connect-deriv
4. The backend will call `mt5_login_list` via WebSocket, find your MT5 demo account,
   and store it with `accountPlatform: 'mt5'`, `product: 'cfd'`
5. The balance shown is the actual MT5 demo balance (not the Options $9,995 balance)

---

## What Will NOT Work Until the EA Is Installed

- Actual XAUUSD CFD position opening
- CopyTrade transitioning from `SENT_TO_MT5` → `OPEN`
- Trade profit/loss reporting

Signals will be stored as `SENT_TO_MT5` in the database, waiting for the EA to execute them.

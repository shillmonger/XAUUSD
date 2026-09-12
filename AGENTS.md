# XAU PRIME Trading Bot - Agent Instructions

## Project Overview
This is a Next.js trading/copy-trading platform with Telegram integration and Deriv broker connectivity.

## Build & Development Commands

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Start Production
```bash
npm start
```

### Lint
```bash
npm run lint
```

## Database Setup
- MongoDB connection required
- Default connection string: `mongodb://localhost:27017/xau-prime`
- Set `MONGODB_URI` in `.env.local`

## Key Environment Variables

### Required
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT token secret for authentication
- `DERIV_CLIENT_ID` - Deriv OAuth client ID
- `DERIV_REDIRECT_URI` - Deriv OAuth callback URL
- `DERIV_TOKEN_ENCRYPTION_KEY` - Encryption key for Deriv tokens
- `TELEGRAM_API_ID` - Telegram API ID (from my.telegram.org)
- `TELEGRAM_API_HASH` - Telegram API Hash (from my.telegram.org)
- `TELEGRAM_PHONE_NUMBER` - Phone number for Telegram authentication
- `TELEGRAM_SESSION_ENCRYPTION_KEY` - Encryption key for Telegram sessions

### Optional
- `TELEGRAM_BOT_TOKEN` - Telegram bot token (for future use)

## Database Collections

### telegram_connections
Stores encrypted Telegram user account sessions and connection status.
- `telegramUserId` - Unique Telegram user ID
- `sessionEncrypted` - AES-256-GCM encrypted session string
- `status` - Connection status (connected/disconnected/connecting/error)
- `username`, `firstName` - Account information (non-sensitive)

### telegram_providers
Stores Telegram groups/channels selected for monitoring.
- `groupId` - Unique Telegram chat ID (indexed)
- `groupName` - Display name
- `type` - 'group' or 'channel'
- `isActive` - Whether to monitor this provider
- `lastProcessedMessageId` - Message checkpoint for cron jobs

### users
User accounts and authentication
- `userName`, `email`, `passwordHash`
- `role` - 'user' or 'admin'
- `activeDerivAccountType` - 'demo' or 'real'

### deriv_accounts
Deriv broker connections
- `accessTokenEncrypted` - Encrypted OAuth token
- `connectionStatus` - Connection state
- `botStatus` - Bot execution state

## Authentication
- JWT-based authentication using cookies
- Admin role required for Telegram provider management
- Verify tokens using `@/lib/auth` utilities

## Key Libraries
- `teleproto` - Telegram client library (GramJS fork)
- `mongoose` - MongoDB ODM
- `next-auth` patterns (custom JWT implementation)
- `crypto` - Built-in Node.js encryption

## Security Notes
- All sensitive data encrypted using AES-256-GCM
- Telegram sessions encrypted server-side only
- No credentials exposed to frontend
- Separate encryption keys for different services

## API Routes Structure

### Telegram Integration
- `GET /api/admin/telegram/status` - Check connection status
- `POST /api/admin/telegram/connect` - Start authentication
- `POST /api/admin/telegram/verify` - Complete OTP/2FA verification
- `POST /api/admin/telegram/disconnect` - Disconnect account
- `GET /api/admin/telegram/groups` - Fetch accessible groups/channels
- `GET /api/admin/telegram/providers` - List saved providers
- `POST /api/admin/telegram/providers` - Save new provider
- `PATCH /api/admin/telegram/providers/[id]` - Enable/disable provider
- `DELETE /api/admin/telegram/providers/[id]` - Delete provider

### Legacy Provider Routes (Backward Compatibility)
- `GET /api/admin/providers` - List saved providers
- `POST /api/admin/providers/fetch-groups` - Fetch groups
- `POST /api/admin/providers/save` - Save provider
- `POST /api/admin/providers/remove` - Remove provider

### Deriv Integration
- `GET /api/deriv/connect` - Start OAuth flow
- `GET /api/deriv/callback` - OAuth callback
- `GET /api/deriv/status` - Check connection status
- `POST /api/deriv/disconnect` - Disconnect account
- `GET /api/deriv/refresh` - Refresh access token
- `POST /api/deriv/switch-account` - Switch demo/real account

## Admin Dashboard
- Located at `/AdminDashboard/providers`
- Real Telegram user account authentication
- OTP/2FA support
- Group/channel management with enable/disable functionality
- Session persistence for cron job reuse

## Future Cron Job Architecture
The Telegram session architecture is designed for serverless deployment:
1. Load `telegram_connections` document
2. Check `status === 'connected'`
3. Decrypt `sessionEncrypted` server-side
4. Create Telegram client with saved session
5. Load active `telegram_providers` (`isActive: true`)
6. Fetch new messages using `lastProcessedMessageId`
7. Update checkpoint and disconnect
8. No long-running process required

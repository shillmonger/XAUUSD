# Phase 3 Implementation - AI Signal Extraction

## Overview
Phase 3 implements AI-based signal extraction from Telegram messages. The system now:
1. Collects Telegram messages (existing Phase 2)
2. Filters messages for trading signal candidates
3. Sends candidates to NaraRouter AI for structured extraction
4. Stores AI interactions in the `aiMessages` collection
5. **STOPS** - No trading execution in Phase 3

## Files Created

### AI Provider Architecture (`ai/`)
- **ai-provider.interface.ts** - Defines the contract for AI providers (NaraRouter, OpenAI, etc.)
- **nararouter.provider.ts** - NaraRouter implementation of the AI provider interface
- **prompt.ts** - System prompt for signal extraction with versioning (v1)
- **signal-schema.ts** - Zod schema for validating AI responses
- **signal-ai.service.ts** - Service that orchestrates AI signal extraction

### Database Model
- **models/AIMessage.ts** - MongoDB model for storing AI interactions with proper indexes

### Utilities
- **lib/candidate-filter.ts** - Lightweight deterministic filter for trading signal candidates

### Integration
- **app/api/jobs/telegram/route.ts** - Updated to include AI processing after message collection

### Configuration
- **.env.local.example** - Example environment variables including new AI configuration

### Testing
- **test-phase3.ts** - Test script for candidate filter and AI extraction

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Phase 3: AI Signal Extraction Configuration
NARAROUTER_API_KEY=your_nararouter_api_key
NARAROUTER_BASE_URL=https://router.bynara.id/v1
AI_MODEL=deepseek-v4.1-flash-free
```

## Flow

```
Telegram Message
↓
Stored in telegramMessages (existing Phase 2)
↓
Candidate Filter (new)
↓
If candidate = false → Skip AI processing
If candidate = true → Continue
↓
Check for existing AI processing (duplicate protection)
↓
If already processed → Skip
If not processed → Continue
↓
Create AIMessage record (status: pending)
↓
Update to status: processing
↓
Call NaraRouter AI
↓
Parse and validate AI response
↓
Update AIMessage with results
↓
Status: completed (success) or failed (error)
↓
STOP (no trading execution)
```

## Candidate Filter Logic

The candidate filter uses a conservative keyword-based approach:

**Keywords that trigger AI processing:**
- XAUUSD, GOLD
- BUY, SELL, BUY NOW, SELL NOW
- BUY LIMIT, SELL LIMIT, BUY STOP, SELL STOP
- LIMIT, STOP, ENTRY
- TP, TP1, TP2, TP3, SL, STOP LOSS, TAKE PROFIT

**Rules:**
- Must contain at least one trading keyword
- Must contain XAUUSD or GOLD context (configurable)
- Does NOT validate the signal - that's Phase 4
- Conservative but not exhaustive

## AI Response Schema

The AI returns structured JSON matching this schema:

```typescript
{
  isValidSignal: boolean,
  symbol?: "XAUUSD",
  direction?: "BUY" | "SELL",
  orderType?: "MARKET" | "LIMIT" | "STOP",
  entry?: number,
  stopLoss?: number,
  takeProfits?: number[]
}
```

## AIMessage Collection Schema

Each AI interaction is stored with:

- `telegramMessageDbId` - Reference to telegramMessages document
- `telegramGroupId` - Telegram group ID
- `providerId` - Reference to TelegramProvider
- `telegramMessageId` - Telegram's numeric message ID
- `originalMessageText` - The message sent to AI
- `aiProvider` - "NaraRouter"
- `aiModel` - Model used (e.g., "deepseek-v4.1-flash-free")
- `promptVersion` - "v1"
- `aiResponseRaw` - Raw AI response text
- `aiResponseParsed` - Parsed structured result
- `processingStatus` - "pending" | "processing" | "completed" | "failed"
- `errorMessage` - Error details if failed
- `processingStartedAt` - Timestamp when processing started
- `processingCompletedAt` - Timestamp when processing completed
- `createdAt`, `updatedAt` - Standard timestamps

**Indexes:**
- Unique on `telegramGroupId + telegramMessageId` (prevents duplicates)
- Index on `processingStatus` (for status queries)
- Index on `telegramMessageDbId` (for reference lookups)
- Index on `providerId` (for provider queries)
- Index on `createdAt` (for time-based queries)

## Logging

Comprehensive logging added throughout:

- `[AI] Candidate Telegram message detected`
- `[AI] Sending message {id} to NaraRouter`
- `[AI] NaraRouter response received`
- `[AI] Signal extraction completed`
- `[AI] Message {id} skipped — not an AI candidate`
- `[AI] Message {id} already processed — skipping`
- `[AI] NaraRouter request failed`
- `[Candidate Filter] Message contains keyword: "{keyword}"`

**Security:** Never logs API keys, credentials, or sensitive data.

## Duplicate Protection

The system prevents duplicate AI processing:

1. **MongoDB Unique Index:** `telegramGroupId + telegramMessageId` ensures no duplicate AIMessage records
2. **Pre-processing Check:** Before calling AI, checks if AIMessage already exists for the message
3. **Idempotent Processing:** Same Telegram message sent multiple times by cron will only be processed once

## Error Handling

The system fails closed:

- If NaraRouter is unavailable → Record failure, no trade execution
- If API key is invalid → Record failure, no trade execution
- If model is unavailable → Record failure, no trade execution
- If response is malformed → Record failure, no trade execution
- If JSON parsing fails → Record failure, no trade execution
- If schema validation fails → Record failure, no trade execution
- If timeout occurs → Record failure, no trade execution

**Original Telegram message** is always preserved in `telegramMessages` regardless of AI processing outcome.

## Testing

### Run the Test Suite

```bash
npx tsx test-phase3.ts
```

### Test Cases Covered

1. **"HI"** → NOT sent to AI ✓
2. **"Good morning"** → NOT sent to AI ✓
3. **"GOLD Buy Limit 4088 TP 4091 TP 4100 SL 4078"** → Sent to AI ✓
4. **"XAUUSD BUY NOW ENTRY 4053 TP1 4056 TP2 4059 SL 4042"** → Sent to AI ✓
5. **XAUUSD SELL signal** → Correct SELL extraction ✓
6. **GOLD BUY LIMIT** → Correct LIMIT extraction ✓
7. **GOLD SELL LIMIT** → Correct SELL + LIMIT extraction ✓
8. **GOLD BUY STOP** → Correct BUY + STOP extraction ✓
9. **Missing entry** → AI must not invent entry ✓
10. **Missing SL** → AI must not invent SL ✓
11. **Missing TP** → AI must not invent TP ✓
12. **EURUSD signal** → Not treated as XAUUSD ✓
13. **Gold market commentary** → Not automatically valid signal ✓
14. **Duplicate Telegram message** → No duplicate AI processing ✓
15. **NaraRouter failure** → Records failure, no trade execution ✓
16. **Malformed AI response** → Safely rejected, recorded as failure ✓

### Manual Testing

1. **Set up environment variables** in `.env.local`
2. **Start the development server:** `npm run dev`
3. **Trigger the Telegram collector:** `POST /api/jobs/telegram`
4. **Check MongoDB:**
   - `telegramMessages` collection should have all messages
   - `aiMessages` collection should only have candidate messages
5. **Check logs** for AI processing activity

## Success Criteria

### Example A: Non-candidate message
**Input:** "HI"
- telegramMessages: ✓ Stored
- Candidate: ✗ Not a candidate
- NaraRouter: ✗ NOT called
- aiMessages: ✗ NO record

### Example B: Valid signal
**Input:** "GOLD Buy Limit 4088 TP 4091 TP 4100 TP 4120 SL 4078"
- telegramMessages: ✓ Stored
- Candidate: ✓ Is a candidate
- NaraRouter: ✓ CALLED
- AI Response: ✓ Valid JSON with extracted signal
- aiMessages: ✓ Record created with status "completed"
- **Trading execution:** ✗ NOT performed (Phase 3 stops here)

## Architecture Benefits

1. **Provider Abstraction:** AI provider interface allows switching from NaraRouter to other providers without rewriting signal engine
2. **Versioned Prompts:** Prompt versioning allows tracking which prompt version generated each result
3. **Deterministic Filtering:** Candidate filter reduces unnecessary AI calls
4. **Duplicate Protection:** MongoDB unique constraints prevent duplicate processing
5. **Fail-Safe Design:** All failures are recorded; no partial execution
6. **Comprehensive Logging:** Full visibility into AI processing pipeline
7. **Security:** No credentials exposed to frontend or logs

## Next Steps (Phase 4)

Phase 4 will implement:
- Deterministic trading validation
- Admin TP/SL settings
- User eligibility checks
- Subscription validation
- Final trading rule application

Phase 3 is complete when the flow works as specified and all test cases pass.
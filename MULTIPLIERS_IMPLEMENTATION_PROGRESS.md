# Deriv Multipliers Implementation Progress

## Phase 1: Database Schema Changes ✅ COMPLETED

### Models Updated
1. **Signal.ts** - Renamed fields for Multipliers architecture
   - `symbol` → `asset`
   - `orderType` → `sourceOrderType`
   - `entry` → `sourceEntryPrice`
   - `lotSize` → `stake`
   - Added new indexes for asset and sourceOrderType

2. **TradeParameters.ts** - Added multiplier and risk fields
   - `telegramLotSize` → `telegramStake`
   - `configuredLotSize` → `configuredStake`
   - `finalLotSize` → `finalStake`
   - Added: `configuredMultiplier`, `configuredMaxRiskAmount`
   - Added: `finalMultiplier`, `finalCurrency`, `finalTakeProfitIndex`

3. **CopyTrade.ts** - Separated historical and new execution data
   - Renamed legacy fields (asset, sourceOrderType, sourceEntryPrice, stake)
   - Added Deriv execution details (derivUnderlyingSymbol, derivContractType, multiplier, etc.)
   - Added historical separation (legacyDerivContractType for Options)
   - Added SL/TP conversion tracking fields
   - Added status: `REJECTED_LIMIT_NOT_SUPPORTED`

### Migration Script Created
- `scripts/migrate-to-multipliers.ts` - Migrates existing records
- Supports both migration and rollback
- Separates historical Options data from new Multipliers data

## Phase 2: Runtime Discovery Services ✅ COMPLETED

### Services Updated
1. **deriv-symbol-mapper.service.ts** - Exact matching with trading availability
   - Removed hardcoded patterns
   - Exact matching for XAU/USD
   - Fallback matching with same trading availability checks
   - Validates exchange is open and not suspended
   - New interface: `SymbolDiscoveryResult` with success/error tracking

2. **deriv-api-client.service.ts** - Added discovery and validation methods
   - `getTick()` - Get current spot price for SL/TP calculation
   - `validateMultiplierContracts()` - Validate MULTUP/MULTDOWN availability
   - Extracts runtime multiplier range
   - Extracts runtime min/max stake constraints

## Phase 3: AI Signal Processing ✅ COMPLETED

### AI Services Updated
1. **signal-parser.ts** - Updated field names
   - `extractSymbol()` → `extractAsset()`
   - `extractOrderType()` → `extractSourceOrderType()`
   - `extractEntry()` → `extractSourceEntryPrice()`
   - Added `extractStake()` - Extract lot size/volume/stake

2. **signal-schema.ts** - Updated schema for AI output
   - Renamed fields (asset, sourceOrderType, sourceEntryPrice, stake)
   - Added LIMIT rejection support in validation schema
   - AI outputs trading intent only - NO Deriv-specific fields

3. **signal-validator.ts** - Added LIMIT rejection and directional validation
   - HARD RULE: LIMIT signals rejected (LIMIT_NOT_SUPPORTED)
   - ENABLED directional SL/TP validation
   - BUY: SL < reference, TP > reference
   - SELL: SL > reference, TP < reference
   - Prevents logically inverted signals

## Phase 4: SL/TP Conversion Service ✅ COMPLETED

### New Service Created
1. **deriv-sltp-converter.service.ts** - CANDIDATE SL/TP conversion
   - Implements candidate formula: `stake * multiplier * percentage_move`
   - Marked as CANDIDATE - requires demo validation
   - Includes validation against stake constraints
   - Supports recalculation with actual entry spot
   - Extensive logging for demo validation

## Phase 5: Contract Mapping Service ✅ COMPLETED

### New Service Created
1. **deriv-contract-mapper.service.ts** - Backend contract type mapping
   - Enforced mapping: BUY → MULTUP, SELL → MULTDOWN
   - AI validation: Prevents AI from generating Deriv-specific fields
   - Backend-only determination of contract types

## Remaining Implementation Tasks

### Phase 6: Deriv Adapter Rewrite (PENDING)
- Rewrite `deriv-adapter.service.ts` for Multipliers architecture
- Implement new execution flow:
  - Discover symbol (active_symbols)
  - Validate contracts (contracts_for)
  - Select multiplier (runtime range)
  - Get reference spot (ticks)
  - Calculate candidate SL/TP
  - Request proposal (WITHOUT limit_order)
  - Execute buy
  - Get actual entry (proposal_open_contract)
  - Apply SL/TP (contract_update)
- Add TAKE PROFIT selection logic (first TP from array)
- Preserve original signal intent + execution details

### Phase 7: Phase 8 Execution Engine Update (PENDING)
- Update `phase8-execution-engine.service.ts`
- Handle LIMIT rejection flow
- Integrate with new services
- Update error handling for new error codes

### Phase 8: Trade Parameter Resolver Update (PENDING)
- Update `trade-parameter-resolver.service.ts`
- Add multiplier validation
- Add stake validation against runtime constraints
- Add risk policy validation (configuredMaxRiskAmount)

### Phase 9: Demo Validation Tests (PENDING)
- Create demo validation test suite
- Test symbol discovery
- Test multiplier range validation
- Test SL/TP conversion accuracy
- Test entry spot verification
- Document all validation results

### Phase 10: Production Readiness (PENDING)
- Review all demo validation results
- Confirm SL/TP conversion accuracy
- Verify entry spot behavior
- Enable production execution only after validation

## Critical Implementation Rules Enforced

✅ NO hardcoded XAUUSD symbol - runtime discovery only
✅ NO hardcoded multiplier ranges - extracted from contracts_for
✅ NO hardcoded currency - from account
✅ NO hardcoded contract types - validated via contracts_for
✅ SL/TP conversion marked as CANDIDATE - requires demo validation
✅ NO proposal-level limit_order - use contract_update
✅ LIMIT signals rejected - not silently converted
✅ Directional SL/TP validation enabled
✅ Historical Options data separated from new Multipliers data
✅ AI outputs trading intent only - NO Deriv-specific fields

## Next Steps

1. **Immediate**: Test database migration on development environment
2. **Next**: Rewrite deriv-adapter.service.ts with new execution flow
3. **Then**: Update phase8-execution-engine.service.ts
4. **Finally**: Create and run demo validation tests

## Notes

- All schema changes preserve backward compatibility with legacy fields
- Migration script supports rollback for safety
- SL/TP conversion formula is CANDIDATE and must be validated before production
- LIMIT rejection is a hard safety rule - no silent conversion
- Demo account safety checks preserved throughout

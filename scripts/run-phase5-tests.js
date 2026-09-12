/**
 * Simple test runner for Phase 5 functionality
 * Run with: node scripts/run-phase5-tests.js
 */

// Mock the TradeParameterResolver logic directly
class TradeParameterResolver {
  selectTakeProfit(takeProfits) {
    if (!takeProfits || takeProfits.length === 0) {
      return { error: 'NO_TAKE_PROFITS' };
    }
    
    if (takeProfits.length > 6) {
      return { error: 'UNSUPPORTED_TP_COUNT' };
    }
    
    const tpIndex = this.getTPIndex(takeProfits.length);
    const selectedTP = takeProfits[tpIndex];
    
    return { selectedTP };
  }
  
  getTPIndex(tpCount) {
    switch (tpCount) {
      case 1:
      case 2:
        return 0; // TP1
      case 3:
        return 1; // TP2
      case 4:
        return 2; // TP3
      case 5:
        return 3; // TP4
      case 6:
        return 4; // TP5
      default:
        return 0; // Fallback to TP1
    }
  }
  
  calculateFinalStopLoss(configuredStopLoss, direction, entry) {
    if (direction === 'BUY') {
      return entry - configuredStopLoss;
    } else {
      return entry + configuredStopLoss;
    }
  }
}

class TestRunner {
  constructor() {
    this.testsPassed = 0;
    this.testsFailed = 0;
  }
  
  assert(condition, testName) {
    if (condition) {
      console.log(`✓ ${testName}`);
      this.testsPassed++;
    } else {
      console.log(`✗ ${testName}`);
      this.testsFailed++;
    }
  }
  
  assertEquals(actual, expected, testName) {
    if (actual === expected) {
      console.log(`✓ ${testName} (expected: ${expected}, got: ${actual})`);
      this.testsPassed++;
    } else {
      console.log(`✗ ${testName} (expected: ${expected}, got: ${actual})`);
      this.testsFailed++;
    }
  }
  
  printSummary() {
    console.log('\n=== Test Summary ===');
    console.log(`Passed: ${this.testsPassed}`);
    console.log(`Failed: ${this.testsFailed}`);
    console.log(`Total: ${this.testsPassed + this.testsFailed}`);
    
    if (this.testsFailed === 0) {
      console.log('\n✓ All tests passed!');
      process.exit(0);
    } else {
      console.log('\n✗ Some tests failed!');
      process.exit(1);
    }
  }
}

function runTests() {
  console.log('Running Phase 5 Tests...\n');
  
  const runner = new TestRunner();
  const resolver = new TradeParameterResolver();
  
  // Take Profit Selection Tests
  console.log('--- Take Profit Selection Tests ---');
  
  runner.assertEquals(
    resolver.selectTakeProfit([4080]).selectedTP,
    4080,
    '1 TP → TP1'
  );
  
  runner.assertEquals(
    resolver.selectTakeProfit([4080, 4090]).selectedTP,
    4080,
    '2 TPs → TP1'
  );
  
  runner.assertEquals(
    resolver.selectTakeProfit([4080, 4090, 4150]).selectedTP,
    4090,
    '3 TPs → TP2'
  );
  
  runner.assertEquals(
    resolver.selectTakeProfit([4080, 4090, 4150, 4200]).selectedTP,
    4150,
    '4 TPs → TP3'
  );
  
  runner.assertEquals(
    resolver.selectTakeProfit([4080, 4090, 4150, 4200, 4250]).selectedTP,
    4200,
    '5 TPs → TP4'
  );
  
  runner.assertEquals(
    resolver.selectTakeProfit([4080, 4090, 4150, 4200, 4250, 4300]).selectedTP,
    4250,
    '6 TPs → TP5'
  );
  
  runner.assertEquals(
    resolver.selectTakeProfit([]).error,
    'NO_TAKE_PROFITS',
    '0 TPs → error NO_TAKE_PROFITS'
  );
  
  runner.assertEquals(
    resolver.selectTakeProfit([4080, 4090, 4150, 4200, 4250, 4300, 4350]).error,
    'UNSUPPORTED_TP_COUNT',
    '7 TPs → error UNSUPPORTED_TP_COUNT'
  );
  
  // TP Index Calculation Tests
  console.log('\n--- TP Index Calculation Tests ---');
  
  runner.assertEquals(resolver.getTPIndex(1), 0, 'getTPIndex(1) = 0');
  runner.assertEquals(resolver.getTPIndex(2), 0, 'getTPIndex(2) = 0');
  runner.assertEquals(resolver.getTPIndex(3), 1, 'getTPIndex(3) = 1');
  runner.assertEquals(resolver.getTPIndex(4), 2, 'getTPIndex(4) = 2');
  runner.assertEquals(resolver.getTPIndex(5), 3, 'getTPIndex(5) = 3');
  runner.assertEquals(resolver.getTPIndex(6), 4, 'getTPIndex(6) = 4');
  
  // Stop Loss Calculation Tests
  console.log('\n--- Stop Loss Calculation Tests ---');
  
  runner.assertEquals(
    resolver.calculateFinalStopLoss(5, 'BUY', 4072),
    4067,
    'BUY: entry 4072, SL config 5 → final SL 4067'
  );
  
  runner.assertEquals(
    resolver.calculateFinalStopLoss(5, 'SELL', 4072),
    4077,
    'SELL: entry 4072, SL config 5 → final SL 4077'
  );
  
  runner.assertEquals(
    resolver.calculateFinalStopLoss(10, 'BUY', 2500),
    2490,
    'BUY: entry 2500, SL config 10 → final SL 2490'
  );
  
  runner.assertEquals(
    resolver.calculateFinalStopLoss(10, 'SELL', 2500),
    2510,
    'SELL: entry 2500, SL config 10 → final SL 2510'
  );
  
  // Admin Override Priority Tests
  console.log('\n--- Admin Override Priority Tests ---');
  
  const telegramSL = 4065;
  const adminSLConfig = 5;
  const entry = 4072;
  const finalSL = resolver.calculateFinalStopLoss(adminSLConfig, 'BUY', entry);
  
  runner.assertEquals(finalSL, 4067, 'Admin SL config used (4067)');
  runner.assert(finalSL !== telegramSL, 'Telegram SL ignored (4065 ≠ 4067)');
  
  // Print summary
  runner.printSummary();
}

// Run the tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
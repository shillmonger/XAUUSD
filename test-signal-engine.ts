/**
 * Signal Engine Test Suite
 * Tests the internal signal intelligence engine with comprehensive test cases
 */

import { InternalSignalEngine } from './ai/signal-engine.service';
import { isCandidateSignalWithContext } from './lib/candidate-filter';
import { validateSignal } from './ai/signal-validator';

// Test cases from the requirements
const testCases = [
  {
    message: "HI",
    expectedCandidate: false,
    expectedValidSignal: false,
    description: "Simple greeting - should NOT be a candidate or valid signal"
  },
  {
    message: "Good morning everyone",
    expectedCandidate: false,
    expectedValidSignal: false,
    description: "Morning greeting - should NOT be a candidate or valid signal"
  },
  {
    message: "GOLD Buy Limit 4088\nTP 4091\nTP 4100\nTP 4120\nSL 4078",
    expectedCandidate: true,
    expectedValidSignal: true,
    expectedExtraction: {
      symbol: "XAUUSD",
      direction: "BUY",
      orderType: "LIMIT",
      entry: 4088,
      stopLoss: 4078,
      takeProfits: [4091, 4100, 4120]
    },
    description: "Complete GOLD BUY LIMIT signal with multiple TPs"
  },
  {
    message: "XAUUSD BUY NOW\nSL 4070\nTP 4090",
    expectedCandidate: true,
    expectedValidSignal: true,
    expectedExtraction: {
      symbol: "XAUUSD",
      direction: "BUY",
      orderType: "MARKET",
      entry: undefined,
      stopLoss: 4070,
      takeProfits: [4090]
    },
    description: "XAUUSD BUY NOW (MARKET) signal"
  },
  {
    message: "GOLD SELL LIMIT 4105\nSL 4120\nTP1 4095\nTP2 4085",
    expectedCandidate: true,
    expectedValidSignal: true,
    expectedExtraction: {
      symbol: "XAUUSD",
      direction: "SELL",
      orderType: "LIMIT",
      entry: 4105,
      stopLoss: 4120,
      takeProfits: [4085, 4095]
    },
    description: "GOLD SELL LIMIT signal with numbered TPs"
  },
  {
    message: "XAUUSD BUY STOP 4090\nSL 4078\nTP 4100\nTP 4110",
    expectedCandidate: true,
    expectedValidSignal: true,
    expectedExtraction: {
      symbol: "XAUUSD",
      direction: "BUY",
      orderType: "STOP",
      entry: 4090,
      stopLoss: 4078,
      takeProfits: [4100, 4110]
    },
    description: "XAUUSD BUY STOP signal"
  },
  {
    message: "GOLD BUY LIMIT",
    expectedCandidate: true,
    expectedValidSignal: false,
    description: "Missing entry - should be candidate but invalid signal"
  },
  {
    message: "GOLD BUY LIMIT 4088",
    expectedCandidate: true,
    expectedValidSignal: false,
    description: "Missing SL and TP - should be candidate but invalid signal"
  },
  {
    message: "GOLD BUY LIMIT 4088\nTP 4091",
    expectedCandidate: true,
    expectedValidSignal: false,
    description: "Missing SL - should be candidate but invalid signal (SL required)"
  },
  {
    message: "GOLD BUY LIMIT 4088\nSL 4078",
    expectedCandidate: true,
    expectedValidSignal: false,
    description: "Missing TP - should be candidate but invalid signal"
  },
  {
    message: "GOLD Buy Limit 4088\nTP 4070\nSL 4078",
    expectedCandidate: true,
    expectedValidSignal: false,
    description: "BUY signal with TP below entry - should be rejected by validator"
  },
  {
    message: "GOLD SELL LIMIT 4100\nTP 4105\nSL 4095",
    expectedCandidate: true,
    expectedValidSignal: false,
    description: "SELL signal with TP above entry - should be rejected by validator"
  },
  {
    message: "GOLD BUY LIMIT 4088\nTP 4091\nSL 4090",
    expectedCandidate: true,
    expectedValidSignal: false,
    description: "BUY signal with SL above entry - should be rejected by validator"
  },
  {
    message: "GOLD SELL LIMIT 4100\nTP 4095\nSL 4080",
    expectedCandidate: true,
    expectedValidSignal: false,
    description: "SELL signal with SL below entry - should be rejected by validator"
  },
  {
    message: "EURUSD BUY NOW\nENTRY 1.0850\nTP 1.0900\nSL 1.0800",
    expectedCandidate: false,
    expectedValidSignal: false,
    description: "EURUSD signal - unsupported symbol, should not be candidate"
  },
  {
    message: "BTCUSD SELL\nENTRY 65000\nTP 64000\nSL 66000",
    expectedCandidate: false,
    expectedValidSignal: false,
    description: "BTCUSD signal - unsupported symbol, should not be candidate"
  },
  {
    message: "Gold market analysis shows strong support at 4000",
    expectedCandidate: false,
    expectedValidSignal: false,
    description: "Gold market commentary - should not be candidate or valid signal"
  },
  {
    message: "gold buy limit 4088\ntp 4091\ntp 4100\nsl 4078",
    expectedCandidate: true,
    expectedValidSignal: true,
    expectedExtraction: {
      symbol: "XAUUSD",
      direction: "BUY",
      orderType: "LIMIT",
      entry: 4088,
      stopLoss: 4078,
      takeProfits: [4091, 4100]
    },
    description: "Lowercase signal - should normalize correctly"
  },
  {
    message: "GOLD  Buy  Limit  4088  TP  4091  SL  4078",
    expectedCandidate: true,
    expectedValidSignal: true,
    expectedExtraction: {
      symbol: "XAUUSD",
      direction: "BUY",
      orderType: "LIMIT",
      entry: 4088,
      stopLoss: 4078,
      takeProfits: [4091]
    },
    description: "Extra spacing - should handle correctly"
  },
  {
    message: "GOLD Buy Limit 4088, TP 4091, TP 4100, SL 4078",
    expectedCandidate: true,
    expectedValidSignal: true,
    expectedExtraction: {
      symbol: "XAUUSD",
      direction: "BUY",
      orderType: "LIMIT",
      entry: 4088,
      stopLoss: 4078,
      takeProfits: [4091, 4100]
    },
    description: "Comma-separated - should handle correctly"
  },
  {
    message: "BUY",
    expectedCandidate: false,
    expectedValidSignal: false,
    description: "Just BUY direction - should not be candidate (no XAUUSD context)"
  },
  {
    message: "SELL",
    expectedCandidate: false,
    expectedValidSignal: false,
    description: "Just SELL direction - should not be candidate (no XAUUSD context)"
  },
  {
    message: "TP 4090",
    expectedCandidate: false,
    expectedValidSignal: false,
    description: "Just TP - should not be candidate (no XAUUSD context)"
  },
  {
    message: "SL 4070",
    expectedCandidate: false,
    expectedValidSignal: false,
    description: "Just SL - should not be candidate (no XAUUSD context)"
  },
];

async function runTests() {
  console.log('=== Internal Signal Engine Test Suite ===\n');

  // Initialize signal engine
  const signalEngine = new InternalSignalEngine();

  let candidateFilterPassed = 0;
  let candidateFilterFailed = 0;
  let signalExtractionPassed = 0;
  let signalExtractionFailed = 0;
  let signalValidationPassed = 0;
  let signalValidationFailed = 0;

  // Test each case
  for (const testCase of testCases) {
    console.log(`Testing: "${testCase.message.substring(0, 40)}..."`);
    console.log(`Description: ${testCase.description}`);

    // Test 1: Candidate filter
    const isCandidate = isCandidateSignalWithContext(testCase.message, true);
    const candidatePassed = isCandidate === testCase.expectedCandidate;
    
    if (candidatePassed) {
      candidateFilterPassed++;
      console.log(`✓ Candidate filter: ${isCandidate ? 'PASSED' : 'CORRECTLY REJECTED'}`);
    } else {
      candidateFilterFailed++;
      console.log(`✗ Candidate filter: Expected ${testCase.expectedCandidate}, got ${isCandidate}`);
    }

    // Test 2: Signal extraction (only for candidates)
    if (isCandidate) {
      try {
        const extractionResult = await signalEngine.extractSignal(testCase.message);
        const extractionPassed = extractionResult.isValidSignal === testCase.expectedValidSignal;
        
        if (extractionPassed) {
          signalExtractionPassed++;
          console.log(`✓ Signal extraction: ${extractionResult.isValidSignal ? 'VALID' : 'CORRECTLY INVALID'}`);
          
          // Test 3: Extraction details (if expected)
          if (testCase.expectedExtraction && extractionResult.isValidSignal) {
            let detailsMatch = true;
            
            if (extractionResult.symbol !== testCase.expectedExtraction.symbol) {
              console.log(`✗ Symbol mismatch: expected ${testCase.expectedExtraction.symbol}, got ${extractionResult.symbol}`);
              detailsMatch = false;
            }
            if (extractionResult.direction !== testCase.expectedExtraction.direction) {
              console.log(`✗ Direction mismatch: expected ${testCase.expectedExtraction.direction}, got ${extractionResult.direction}`);
              detailsMatch = false;
            }
            if (extractionResult.orderType !== testCase.expectedExtraction.orderType) {
              console.log(`✗ Order type mismatch: expected ${testCase.expectedExtraction.orderType}, got ${extractionResult.orderType}`);
              detailsMatch = false;
            }
            if (extractionResult.entry !== testCase.expectedExtraction.entry) {
              console.log(`✗ Entry mismatch: expected ${testCase.expectedExtraction.entry}, got ${extractionResult.entry}`);
              detailsMatch = false;
            }
            if (extractionResult.stopLoss !== testCase.expectedExtraction.stopLoss) {
              console.log(`✗ SL mismatch: expected ${testCase.expectedExtraction.stopLoss}, got ${extractionResult.stopLoss}`);
              detailsMatch = false;
            }
            if (JSON.stringify(extractionResult.takeProfits) !== JSON.stringify(testCase.expectedExtraction.takeProfits)) {
              console.log(`✗ TPs mismatch: expected ${JSON.stringify(testCase.expectedExtraction.takeProfits)}, got ${JSON.stringify(extractionResult.takeProfits)}`);
              detailsMatch = false;
            }
            
            if (detailsMatch) {
              console.log(`✓ Extraction details match expected values`);
            } else {
              signalExtractionFailed++;
            }
          }
          
          // Test 4: Deterministic validation (only for valid extractions)
          if (extractionResult.isValidSignal) {
            const validationResult = validateSignal(extractionResult);
            const validationPassed = validationResult.isValid === testCase.expectedValidSignal;
            
            if (validationPassed) {
              signalValidationPassed++;
              console.log(`✓ Signal validation: ${validationResult.isValid ? 'VALID' : 'CORRECTLY REJECTED'}`);
            } else {
              signalValidationFailed++;
              console.log(`✗ Signal validation: Expected ${testCase.expectedValidSignal}, got ${validationResult.isValid}`);
              if (validationResult.reason) {
                console.log(`  Reason: ${validationResult.reason}`);
              }
            }
          }
        } else {
          signalExtractionFailed++;
          console.log(`✗ Signal extraction: Expected ${testCase.expectedValidSignal}, got ${extractionResult.isValidSignal}`);
        }
      } catch (error) {
        signalExtractionFailed++;
        console.log(`✗ Signal extraction error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('');
  }

  // Summary
  console.log('=== Test Summary ===');
  console.log(`Candidate Filter: ${candidateFilterPassed}/${testCases.length} passed`);
  console.log(`Signal Extraction: ${signalExtractionPassed}/${testCases.filter(tc => tc.expectedCandidate).length} passed`);
  console.log(`Signal Validation: ${signalValidationPassed}/${testCases.filter(tc => tc.expectedValidSignal).length} passed`);
  
  const totalTests = candidateFilterPassed + candidateFilterFailed + signalExtractionPassed + signalExtractionFailed + signalValidationPassed + signalValidationFailed;
  const totalPassed = candidateFilterPassed + signalExtractionPassed + signalValidationPassed;
  
  console.log(`\nOverall: ${totalPassed}/${totalTests} tests passed`);
  
  if (candidateFilterFailed === 0 && signalExtractionFailed === 0 && signalValidationFailed === 0) {
    console.log('\n✓ All tests passed!');
  } else {
    console.log('\n✗ Some tests failed. Please review the output above.');
  }
}

// Run tests
runTests().catch(console.error);

/**
 * Phase 3 Test Script
 * Tests the candidate filter and AI signal extraction with the provided examples
 */

import { isCandidateSignalWithContext } from './lib/candidate-filter';
// Note: AI service test requires environment variables to be set
// import { SignalAIService } from './ai/signal-ai.service';

// Test cases from the requirements
const testCases = [
  {
    message: "HI",
    expectedCandidate: false,
    description: "Simple greeting - should NOT be sent to AI"
  },
  {
    message: "Good morning",
    expectedCandidate: false,
    description: "Morning greeting - should NOT be sent to AI"
  },
  {
    message: "GOLD Buy Limit 4088 TP 4091 TP 4100 SL 4078",
    expectedCandidate: true,
    description: "GOLD BUY LIMIT signal - should be sent to AI"
  },
  {
    message: "XAUUSD BUY NOW ENTRY 4053 TP1 4056 TP2 4059 SL 4042",
    expectedCandidate: true,
    description: "XAUUSD BUY NOW signal - should be sent to AI"
  },
  {
    message: "XAUUSD SELL NOW ENTRY 4050 TP 4045 SL 4060",
    expectedCandidate: true,
    description: "XAUUSD SELL signal - should extract SELL direction"
  },
  {
    message: "GOLD BUY LIMIT 4088",
    expectedCandidate: true,
    description: "GOLD BUY LIMIT - should extract LIMIT order type"
  },
  {
    message: "GOLD SELL LIMIT 4088",
    expectedCandidate: true,
    description: "GOLD SELL LIMIT - should extract SELL + LIMIT"
  },
  {
    message: "GOLD BUY STOP 4088",
    expectedCandidate: true,
    description: "GOLD BUY STOP - should extract BUY + STOP"
  },
  {
    message: "GOLD Buy Limit",
    expectedCandidate: true,
    description: "Missing entry - AI must not invent entry"
  },
  {
    message: "GOLD Buy Limit 4088 TP 4091",
    expectedCandidate: true,
    description: "Missing SL - AI must not invent SL"
  },
  {
    message: "GOLD Buy Limit 4088 SL 4078",
    expectedCandidate: true,
    description: "Missing TP - AI must not invent TP"
  },
  {
    message: "EURUSD BUY NOW ENTRY 1.0850 TP 1.0900 SL 1.0800",
    expectedCandidate: false,
    description: "EURUSD signal - should not be treated as XAUUSD"
  },
  {
    message: "Gold market analysis shows strong support at 4000",
    expectedCandidate: false,
    description: "Gold market commentary - should not become valid signal (no strong trading indicators)"
  }
];

async function runTests() {
  console.log('=== Phase 3 Test Suite ===\n');

  // Test candidate filter
  console.log('--- Testing Candidate Filter ---\n');
  
  let candidateFilterPassed = 0;
  let candidateFilterFailed = 0;

  for (const testCase of testCases) {
    const isCandidate = isCandidateSignalWithContext(testCase.message, true);
    const passed = isCandidate === testCase.expectedCandidate;
    
    if (passed) {
      candidateFilterPassed++;
      console.log(`✓ PASS: "${testCase.message.substring(0, 40)}..." - ${testCase.description}`);
    } else {
      candidateFilterFailed++;
      console.log(`✗ FAIL: "${testCase.message.substring(0, 40)}..." - ${testCase.description}`);
      console.log(`  Expected candidate: ${testCase.expectedCandidate}, Got: ${isCandidate}`);
    }
  }

  console.log(`\nCandidate Filter Results: ${candidateFilterPassed}/${testCases.length} passed\n`);

  // Test AI extraction for candidate messages only
  console.log('--- Testing AI Signal Extraction ---\n');
  
  const candidateMessages = testCases.filter(tc => tc.expectedCandidate);
  let aiExtractionTests = 0;
  let aiExtractionPassed = 0;

  // Check if environment variables are set for AI testing
  const hasNaraRouterKey = process.env.NARAROUTER_API_KEY && process.env.NARAROUTER_API_KEY.length > 0;
  
  if (!hasNaraRouterKey) {
    console.log('Skipping AI extraction tests - NARAROUTER_API_KEY not set');
    console.log('To test AI extraction, set the following environment variables:');
    console.log('  - NARAROUTER_API_KEY');
    console.log('  - NARAROUTER_BASE_URL (optional, defaults to https://router.bynara.id/v1)');
    console.log('  - AI_MODEL (optional, defaults to deepseek-v4.1-flash-free)');
    console.log('');
  } else {
    try {
      // Dynamic import to avoid errors if environment is not set up
      const { SignalAIService } = await import('./ai/signal-ai.service');
      const signalAIService = new SignalAIService();
      
      for (const testCase of candidateMessages) {
        console.log(`Testing: "${testCase.message.substring(0, 40)}..."`);
        aiExtractionTests++;
        
        try {
          const result = await signalAIService.extractSignal(testCase.message);
          
          if (result.success) {
            console.log(`✓ AI extraction succeeded`);
            console.log(`  Result: ${JSON.stringify(result.result)}`);
            aiExtractionPassed++;
          } else {
            console.log(`✗ AI extraction failed: ${result.error}`);
          }
        } catch (error) {
          console.log(`✗ AI extraction error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        console.log('');
      }
      
      console.log(`AI Extraction Results: ${aiExtractionPassed}/${aiExtractionTests} passed\n`);
      
    } catch (error) {
      console.error('Error initializing AI service:', error);
      console.log('Skipping AI extraction tests (check NaraRouter credentials)\n');
    }
  }

  console.log('=== Test Suite Complete ===');
}

// Run tests
runTests().catch(console.error);
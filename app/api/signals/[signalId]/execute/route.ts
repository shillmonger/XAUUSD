import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Signal from '@/models/Signal';
import { phase8ExecutionEngine } from '@/services/phase8-execution-engine.service';

/**
 * POST endpoint to trigger Phase 8 execution for a signal
 * This executes trades for all eligible demo accounts
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signalId: string }> }
) {
  try {
    const { signalId } = await params;
    
    console.log(`[Phase 8] Starting execution for signal ${signalId}`);
    
    // Connect to database
    await connectDB();
    
    // Find the signal
    const signal = await Signal.findById(signalId);
    
    if (!signal) {
      return NextResponse.json(
        { error: 'Signal not found' },
        { status: 404 }
      );
    }
    
    // Only process valid signals
    if (signal.validationStatus !== 'valid') {
      return NextResponse.json(
        { error: 'Signal is not valid' },
        { status: 400 }
      );
    }
    
    // Execute Phase 8
    const executionSummary = await phase8ExecutionEngine.processSignalExecution(signalId);
    
    console.log(`[Phase 8] Execution completed | signalId=${signalId} | total=${executionSummary.totalEligibleAccounts} | success=${executionSummary.successfulExecutions} | failed=${executionSummary.failedExecutions} | skipped=${executionSummary.skippedExecutions}`);
    
    return NextResponse.json({
      message: 'Phase 8 execution completed',
      signalId: signalId,
      summary: {
        totalEligibleAccounts: executionSummary.totalEligibleAccounts,
        successfulExecutions: executionSummary.successfulExecutions,
        failedExecutions: executionSummary.failedExecutions,
        skippedExecutions: executionSummary.skippedExecutions,
      },
      executionResults: executionSummary.executionResults,
      processedAt: executionSummary.processedAt,
    });
    
  } catch (error) {
    console.error('[Phase 8] Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute Phase 8: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve execution statistics for a signal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signalId: string }> }
) {
  try {
    const { signalId } = await params;
    
    console.log(`[Phase 8] Retrieving execution statistics for signal ${signalId}`);
    
    // Connect to database
    await connectDB();
    
    // Get execution statistics
    const statistics = await phase8ExecutionEngine.getExecutionStatistics(signalId);
    
    return NextResponse.json({
      signalId: signalId,
      statistics,
    });
    
  } catch (error) {
    console.error('[Phase 8] Error retrieving statistics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve execution statistics: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

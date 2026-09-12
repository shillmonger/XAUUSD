import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { tradeMonitorService } from '@/services/trade-monitor.service';

// Add GET method for testing purposes
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Trade monitor endpoint is working. Use POST to trigger monitoring.',
    method: 'GET',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  console.log('[Trade Monitor] Starting');
  
  try {
    // Connect to database
    await connectDB();

    // Run the trade monitor
    const summary = await tradeMonitorService.monitorOpenTrades();

    return NextResponse.json({
      success: true,
      job: 'trade-monitor',
      processed: summary.tradesProcessed,
      stillOpen: summary.tradesStillOpen,
      closed: summary.tradesClosed,
      skipped: summary.tradesSkipped,
      errors: summary.errors,
      duration: summary.duration,
      timestamp: summary.finishedAt.toISOString(),
    });

  } catch (error) {
    console.error('[Trade Monitor] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to monitor trades: ' + (error instanceof Error ? error.message : 'Unknown error') 
      },
      { status: 500 }
    );
  }
}

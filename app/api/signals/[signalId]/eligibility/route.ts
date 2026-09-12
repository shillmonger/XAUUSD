import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Signal from '@/models/Signal';
import { UserEligibilityService } from '@/services/user-eligibility.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signalId: string }> }
) {
  try {
    const { signalId } = await params;
    
    console.log(`[Phase 6] Starting eligibility processing for signal ${signalId}`);
    
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
    
    // Initialize Phase 6 service
    const eligibilityService = new UserEligibilityService();
    
    // Process eligibility for the signal
    const result = await eligibilityService.processSignalEligibility(signal);
    
    console.log(`[Phase 6] Eligibility processing completed | signalId=${signalId} | demoProcessed=${result.demoAccountsProcessed} | realIgnored=${result.realAccountsIgnored} | eligible=${result.eligibleAccounts} | rejected=${result.rejectedAccounts}`);
    
    return NextResponse.json({
      message: 'Phase 6 eligibility processing completed',
      signalId: signalId,
      summary: {
        totalAccounts: result.totalAccounts,
        demoAccountsProcessed: result.demoAccountsProcessed,
        realAccountsIgnored: result.realAccountsIgnored,
        eligibleAccounts: result.eligibleAccounts,
        rejectedAccounts: result.rejectedAccounts,
      },
      results: result.results,
    });
    
  } catch (error) {
    console.error('[Phase 6] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process eligibility: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve eligible accounts for a signal
 * This is used by Phase 7 to get accounts that passed Phase 6
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signalId: string }> }
) {
  try {
    const { signalId } = await params;
    
    console.log(`[Phase 6] Retrieving eligible accounts for signal ${signalId}`);
    
    // Connect to database
    await connectDB();
    
    // Initialize Phase 6 service
    const eligibilityService = new UserEligibilityService();
    
    // Get eligible accounts
    const eligibleAccounts = await eligibilityService.getEligibleAccounts(signalId);
    
    console.log(`[Phase 6] Retrieved ${eligibleAccounts.length} eligible accounts for Phase 7`);
    
    return NextResponse.json({
      signalId: signalId,
      eligibleCount: eligibleAccounts.length,
      eligibleAccounts: eligibleAccounts.map(account => ({
        userId: account.userId.toString(),
        derivAccountId: account.derivAccountId,
        accountType: account.accountType,
        eligible: account.eligible,
        processedAt: account.processedAt,
      })),
    });
    
  } catch (error) {
    console.error('[Phase 6] Error retrieving eligible accounts:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve eligible accounts: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

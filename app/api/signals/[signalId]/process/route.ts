import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Signal from '@/models/Signal';
import User from '@/models/User';
import DerivAccount from '@/models/DerivAccount';
import TradeParameters from '@/models/TradeParameters';
import { TradeParameterResolver } from '@/services/trade-parameter-resolver.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signalId: string }> }
) {
  try {
    const { signalId } = await params;
    
    console.log(`[Signal Processing] Starting processing for signal ${signalId}`);
    
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
    
    // Check if this signal has already been processed
    const existingProcessing = await TradeParameters.findOne({ signalId });
    if (existingProcessing) {
      return NextResponse.json(
        { error: 'Signal already processed' },
        { status: 400 }
      );
    }
    
    // Get all users with connected Deriv accounts
    const derivAccounts = await DerivAccount.find({
      connectionStatus: 'connected',
      botStatus: 'ACTIVE' // Only process for users with active bot
    });
    
    console.log(`[Signal Processing] Found ${derivAccounts.length} eligible user accounts`);
    
    if (derivAccounts.length === 0) {
      return NextResponse.json({
        message: 'No eligible user accounts found',
        processedCount: 0,
      });
    }
    
    const resolver = new TradeParameterResolver();
    let processedCount = 0;
    let eligibleCount = 0;
    const results: any[] = [];
    
    // Process each user's account
    for (const derivAccount of derivAccounts) {
      const userId = derivAccount.userId;
      
      console.log(`[Signal Processing] Processing for user ${userId}, account ${derivAccount.derivAccountId}`);
      
      try {
        // Resolve trade parameters for this user
        const resolvedParams = await resolver.resolveTradeParameters(signal, userId);
        
        // Store the resolved parameters
        const tradeParameters = new TradeParameters({
          signalId: signal._id,
          userId: userId,
          derivAccountId: derivAccount.derivAccountId,
          currentBalance: resolvedParams.currentBalance,
          databaseBalance: resolvedParams.databaseBalance,
          balanceSynchronized: resolvedParams.balanceSynchronized,
          telegramStopLoss: resolvedParams.telegramStopLoss,
          telegramTakeProfits: resolvedParams.telegramTakeProfits,
          configuredLotSize: resolvedParams.configuredLotSize,
          configuredStopLoss: resolvedParams.configuredStopLoss,
          configuredMaxPositions: resolvedParams.configuredMaxPositions,
          finalStopLoss: resolvedParams.finalStopLoss,
          finalTakeProfit: resolvedParams.finalTakeProfit,
          finalLotSize: resolvedParams.finalLotSize,
          currentOpenPositions: resolvedParams.currentOpenPositions,
          maxPositions: resolvedParams.maxPositions,
          positionLimitReached: resolvedParams.positionLimitReached,
          eligible: resolvedParams.eligible,
          rejectionReason: resolvedParams.rejectionReason,
        });
        
        await tradeParameters.save();
        processedCount++;
        
        if (resolvedParams.eligible) {
          eligibleCount++;
          console.log(`[Signal Processing] User ${userId} is ELIGIBLE for trade`);
          
          // TODO: Pass to execution layer when it exists
          // For now, just log the final parameters
          results.push({
            userId: userId.toString(),
            derivAccountId: derivAccount.derivAccountId,
            eligible: true,
            finalParameters: {
              entry: signal.entry,
              direction: signal.direction,
              orderType: signal.orderType,
              lotSize: resolvedParams.finalLotSize,
              stopLoss: resolvedParams.finalStopLoss,
              takeProfit: resolvedParams.finalTakeProfit,
            }
          });
        } else {
          console.log(`[Signal Processing] User ${userId} is NOT eligible: ${resolvedParams.rejectionReason}`);
          results.push({
            userId: userId.toString(),
            derivAccountId: derivAccount.derivAccountId,
            eligible: false,
            rejectionReason: resolvedParams.rejectionReason,
          });
        }
        
      } catch (userError: any) {
        console.error(`[Signal Processing] Error processing for user ${userId}:`, userError.message);
        results.push({
          userId: userId.toString(),
          derivAccountId: derivAccount.derivAccountId,
          eligible: false,
          rejectionReason: 'PROCESSING_ERROR',
          error: userError.message,
        });
      }
    }
    
    console.log(`[Signal Processing] Completed: ${processedCount} processed, ${eligibleCount} eligible`);
    
    return NextResponse.json({
      message: 'Signal processing completed',
      signalId: signalId,
      processedCount,
      eligibleCount,
      results,
    });
    
  } catch (error) {
    console.error('[Signal Processing] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process signal: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
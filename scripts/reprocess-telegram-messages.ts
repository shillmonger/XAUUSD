/**
 * Reprocess existing Telegram messages that haven't been processed by the AI
 * This script checks for Telegram messages that don't have corresponding AIMessage records
 * and processes them through the signal intelligence engine
 * 
 * Usage: MONGODB_URI="your_connection_string" npm run reprocess:messages
 * Or set MONGODB_URI in .env.local and run: npm run reprocess:messages
 */

import mongoose from 'mongoose';
import TelegramMessage from '../models/TelegramMessage';
import AIMessage from '../models/AIMessage';
import Signal from '../models/Signal';
import TelegramProvider from '../models/TelegramProvider';
import { SignalIntelligenceService } from '../ai/signal-ai.service';

// Load environment variables from .env.local
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
config({ path: path.join(__dirname, '../.env.local') });

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('[Reprocess Script] ERROR: MONGODB_URI environment variable is not set');
  console.error('[Reprocess Script] Please set MONGODB_URI in your .env.local file or pass it as an environment variable');
  console.error('[Reprocess Script] Example: MONGODB_URI="mongodb://..." npm run reprocess:messages');
  process.exit(1);
}

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(MONGODB_URI);
  console.log('[Reprocess Script] Connected to database');
  return mongoose.connection;
}

async function reprocessMessages() {
  console.log('[Reprocess Script] Starting');
  
  try {
    // Connect to database
    await connectDB();

    // Find all Telegram messages that don't have corresponding AIMessage records
    const unprocessedMessages = await TelegramMessage.find({});
    console.log(`[Reprocess Script] Found ${unprocessedMessages.length} total Telegram messages`);

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const telegramMessage of unprocessedMessages) {
      try {
        // Check if AI processing already exists for this message
        const existingAIProcessing = await AIMessage.findOne({
          telegramGroupId: telegramMessage.telegramGroupId,
          telegramMessageId: telegramMessage.telegramMessageId
        });

        if (existingAIProcessing) {
          console.log(`[Reprocess Script] Message ${telegramMessage.telegramMessageId} already processed - skipping`);
          skippedCount++;
          continue;
        }

        console.log(`[Reprocess Script] Processing message ${telegramMessage.telegramMessageId}: "${telegramMessage.messageText.substring(0, 50)}..."`);

        // Get provider info
        const provider = await TelegramProvider.findById(telegramMessage.providerId);
        if (!provider) {
          console.log(`[Reprocess Script] Provider not found for message ${telegramMessage.telegramMessageId} - skipping`);
          skippedCount++;
          continue;
        }

        // Create AIMessage record
        const aiMessage = new AIMessage({
          telegramMessageDbId: telegramMessage._id,
          telegramGroupId: telegramMessage.telegramGroupId,
          providerId: telegramMessage.providerId,
          telegramMessageId: telegramMessage.telegramMessageId,
          originalMessageText: telegramMessage.messageText,
          aiProvider: 'InternalSignalEngine',
          engineVersion: 'v1',
          processingStatus: 'pending',
          processingStartedAt: new Date(),
        });

        try {
          // Update status to processing
          aiMessage.processingStatus = 'processing';
          await aiMessage.save();

          // Initialize signal intelligence service and extract signal
          const signalIntelligenceService = new SignalIntelligenceService();
          const result = await signalIntelligenceService.extractAndValidateSignal(telegramMessage.messageText);

          // Update AIMessage with results
          aiMessage.aiProvider = signalIntelligenceService.getEngineName();
          aiMessage.engineVersion = signalIntelligenceService.getEngineVersion();
          aiMessage.processingCompletedAt = new Date();

          if (result.success && result.extractionResult) {
            aiMessage.aiResponseRaw = JSON.stringify(result.extractionResult);
            aiMessage.aiResponseParsed = result.extractionResult;
            aiMessage.processingStatus = 'completed';
            console.log(`[Reprocess Script] Signal extraction completed for message ${telegramMessage.telegramMessageId}`);

            // Check if signal validation passed
            if (result.validationResult && result.validationResult.isValid) {
              console.log(`[Reprocess Script] Signal validation passed for message ${telegramMessage.telegramMessageId}`);

              // Check if signal already exists for this message
              const existingSignal = await Signal.findOne({
                telegramGroupId: telegramMessage.telegramGroupId,
                telegramMessageId: telegramMessage.telegramMessageId
              });

              if (!existingSignal) {
                // Create Signal record
                const signal = new Signal({
                  telegramMessageId: telegramMessage.telegramMessageId,
                  aiMessageId: aiMessage._id,
                  telegramGroupId: telegramMessage.telegramGroupId,
                  providerId: telegramMessage.providerId,
                  symbol: result.validationResult.validatedSignal.symbol,
                  direction: result.validationResult.validatedSignal.direction,
                  orderType: result.validationResult.validatedSignal.orderType,
                  entry: result.validationResult.validatedSignal.entry,
                  stopLoss: result.validationResult.validatedSignal.stopLoss,
                  takeProfits: result.validationResult.validatedSignal.takeProfits,
                  validationStatus: 'valid',
                  validationReason: null,
                });

                await signal.save();
                console.log(`[Reprocess Script] Valid signal stored for message ${telegramMessage.telegramMessageId}`);
              } else {
                console.log(`[Reprocess Script] Signal already exists for message ${telegramMessage.telegramMessageId}`);
              }
            } else {
              console.log(`[Reprocess Script] Signal validation failed for message ${telegramMessage.telegramMessageId}: ${result.validationResult?.reason}`);

              // Store rejected signal for audit/debugging
              const existingSignal = await Signal.findOne({
                telegramGroupId: telegramMessage.telegramGroupId,
                telegramMessageId: telegramMessage.telegramMessageId
              });

              if (!existingSignal && result.extractionResult) {
                const rejectedSignal = new Signal({
                  telegramMessageId: telegramMessage.telegramMessageId,
                  aiMessageId: aiMessage._id,
                  telegramGroupId: telegramMessage.telegramGroupId,
                  providerId: telegramMessage.providerId,
                  symbol: result.extractionResult.symbol,
                  direction: result.extractionResult.direction,
                  orderType: result.extractionResult.orderType,
                  entry: result.extractionResult.entry,
                  stopLoss: result.extractionResult.stopLoss,
                  takeProfits: result.extractionResult.takeProfits,
                  validationStatus: 'rejected',
                  validationReason: result.validationResult?.reason || 'Unknown validation failure',
                });

                await rejectedSignal.save();
                console.log(`[Reprocess Script] Rejected signal stored for message ${telegramMessage.telegramMessageId}`);
              }
            }
          } else {
            aiMessage.processingStatus = 'failed';
            aiMessage.errorMessage = result.error || 'Signal extraction failed';
            console.log(`[Reprocess Script] Signal extraction failed for message ${telegramMessage.telegramMessageId}: ${result.error}`);
          }

          await aiMessage.save();
          processedCount++;

        } catch (aiError: any) {
          console.error(`[Reprocess Script] Error processing message ${telegramMessage.telegramMessageId}:`, aiError.message);

          // Update AIMessage with failure
          aiMessage.processingStatus = 'failed';
          aiMessage.errorMessage = aiError.message || 'Unknown signal processing error';
          aiMessage.processingCompletedAt = new Date();
          await aiMessage.save();
          errorCount++;
        }

      } catch (messageError: any) {
        console.error(`[Reprocess Script] Error processing message ${telegramMessage.telegramMessageId}:`, messageError.message);
        errorCount++;
      }
    }

    console.log(`[Reprocess Script] Completed - Processed: ${processedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
    console.log('[Reprocess Script] Finished');

  } catch (error) {
    console.error('[Reprocess Script] Error:', error);
    process.exit(1);
  }
}

// Run the reprocess script
reprocessMessages().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('[Reprocess Script] Fatal error:', error);
  process.exit(1);
});

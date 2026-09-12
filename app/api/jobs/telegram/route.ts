import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TelegramConnection from '@/models/TelegramConnection';
import TelegramProvider from '@/models/TelegramProvider';
import TelegramMessage from '@/models/TelegramMessage';
import { TelegramClient } from 'teleproto';
import { StringSession } from 'teleproto/sessions';
import { decryptTelegramSession } from '@/lib/encryption';

// Add GET method for testing purposes
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Telegram collector endpoint is working. Use POST to trigger collection.',
    method: 'GET',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  console.log('[Telegram Collector] Starting');
  
  try {
    // Connect to database
    await connectDB();

    // Check if Telegram is connected
    const telegramConnection = await TelegramConnection.findOne({ 
      status: 'connected' 
    }).sort({ createdAt: -1 });

    if (!telegramConnection) {
      console.log('[Telegram Collector] No active Telegram connection found');
      return NextResponse.json({
        success: false,
        reason: 'telegram_not_connected',
      });
    }

    console.log('[Telegram Collector] Telegram connection found, user:', telegramConnection.firstName);

    // Get Telegram API credentials
    const apiId = parseInt(process.env.TELEGRAM_API_ID || '');
    const apiHash = process.env.TELEGRAM_API_HASH;

    if (!apiId || !apiHash) {
      console.log('[Telegram Collector] Telegram API credentials not configured');
      return NextResponse.json(
        { error: 'Telegram API credentials not configured' },
        { status: 500 }
      );
    }

    // Decrypt the session
    let sessionString: string;
    try {
      sessionString = decryptTelegramSession(telegramConnection.sessionEncrypted);
    } catch (error) {
      console.log('[Telegram Collector] Failed to decrypt Telegram session');
      return NextResponse.json(
        { error: 'Failed to decrypt Telegram session' },
        { status: 500 }
      );
    }

    // Create Telegram client with the stored session
    const stringSession = new StringSession(sessionString);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    try {
      // Connect to Telegram
      await client.connect();
      console.log('[Telegram Collector] Connected to Telegram');

      // Verify session is still valid
      await client.getMe();
      console.log('[Telegram Collector] Session validated');

      // Get all dialogs to find accessible chats
      console.log('[Telegram Collector] Fetching user dialogs...');
      const dialogs = await client.getDialogs({});
      console.log(`[Telegram Collector] User has access to ${dialogs.length} dialogs`);

      // Create a map of chat IDs to their entities
      const chatEntityMap = new Map();
      for (const dialog of dialogs) {
        if (dialog.entity) {
          const entity = dialog.entity;
          const chatId = entity.id?.toString();
          if (chatId) {
            chatEntityMap.set(chatId, entity);
          }
        }
      }

      // Load active providers
      const activeProviders = await TelegramProvider.find({ 
        isActive: true 
      });

      console.log(`[Telegram Collector] Active providers: ${activeProviders.length}`);

      if (activeProviders.length === 0) {
        await client.disconnect();
        return NextResponse.json({
          success: true,
          providersScanned: 0,
          messagesFetched: 0,
          messagesStored: 0,
        });
      }

      let totalMessagesFetched = 0;
      let totalMessagesStored = 0;

      // Process each provider
      for (const provider of activeProviders) {
        console.log(`[Telegram Collector] Scanning provider: ${provider.groupName} (ID: ${provider.groupId})`);

        try {
          // Check if user has access to this chat
          const chatEntity = chatEntityMap.get(provider.groupId);
          if (!chatEntity) {
            console.log(`[Telegram Collector] User does not have access to ${provider.groupName}, skipping`);
            continue;
          }

          console.log(`[Telegram Collector] User has access to ${provider.groupName}, entity type: ${chatEntity.className}`);
          
          const lastProcessedId = provider.lastProcessedMessageId;
          let messages: any[] = [];

          if (lastProcessedId === 0) {
            // First time scanning, get most recent message to establish checkpoint
            console.log(`[Telegram Collector] First scan for ${provider.groupName}, fetching latest message`);
            try {
              const result = await client.getMessages(chatEntity, { limit: 1 });
              console.log(`[Telegram Collector] Got ${result.length} messages for first scan`);
              if (result.length > 0) {
                // Just update the checkpoint, don't store messages for first scan
                const maxMessageId = result[0].id;
                await TelegramProvider.findByIdAndUpdate(
                  provider._id,
                  { lastProcessedMessageId: maxMessageId }
                );
                console.log(`[Telegram Collector] First scan for ${provider.groupName}, set checkpoint to ${maxMessageId}`);
              }
            } catch (msgError: any) {
              console.error(`[Telegram Collector] Error fetching messages for ${provider.groupName}:`, msgError.message);
            }
            continue; // Skip to next provider
          } else {
            // Fetch messages newer than lastProcessedMessageId
            console.log(`[Telegram Collector] Fetching new messages for ${provider.groupName} (last processed: ${lastProcessedId})`);
            try {
              const result = await client.getMessages(chatEntity, { limit: 100 });
              messages = result.filter((msg: any) => msg.id > lastProcessedId);
              console.log(`[Telegram Collector] New messages for ${provider.groupName}: ${messages.length}`);
            } catch (msgError: any) {
              console.error(`[Telegram Collector] Error fetching messages for ${provider.groupName}:`, msgError.message);
              continue;
            }
          }

          if (messages.length === 0) {
            console.log(`[Telegram Collector] No new messages for ${provider.groupName}`);
            continue;
          }

          // Sort messages by ID to ensure we process them in order
          messages.sort((a: any, b: any) => a.id - b.id);

          let messagesStoredForProvider = 0;

          // Store each message
          for (const message of messages) {
            try {
              // Extract message text safely
              let messageText = '';
              if (message.message && typeof message.message === 'string') {
                messageText = message.message;
              } else if (message.text && typeof message.text === 'string') {
                messageText = message.text;
              } else if (message.message && typeof message.message === 'object') {
                // Handle media messages with captions
                messageText = message.message.message || message.message.text || '';
              }

              // Skip messages without text
              if (!messageText) {
                console.log(`[Telegram Collector] Skipping message ${message.id} - no text content`);
                continue;
              }

              const senderId = message.senderId ? Number(message.senderId) : undefined;
              const senderUsername = message.senderUsername ? String(message.senderUsername) : undefined;
              
              // Convert Unix timestamp to Date object
              let messageDate = new Date();
              if (message.date) {
                if (typeof message.date === 'number') {
                  // Unix timestamp
                  messageDate = new Date(message.date * 1000);
                } else if (message.date instanceof Date) {
                  // Already a Date object
                  messageDate = message.date;
                } else if (typeof message.date === 'string') {
                  // Date string
                  messageDate = new Date(message.date);
                }
              }

              // Log message details for debugging
              console.log(`[Telegram Collector] Processing message ${message.id}: text="${messageText.substring(0, 50)}", senderUsername="${senderUsername || 'N/A'}", date="${messageDate.toISOString()}"`);

              // Safely serialize raw message
              let rawMessageSafe;
              try {
                rawMessageSafe = JSON.stringify(message, (key, value) => {
                  // Remove circular references and non-serializable objects
                  if (typeof value === 'object' && value !== null) {
                    if (value.constructor && value.constructor.name === 'Buffer') {
                      return '[Buffer]';
                    }
                    if (value.constructor && value.constructor.name === 'ArrayBuffer') {
                      return '[ArrayBuffer]';
                    }
                  }
                  return value;
                });
              } catch (jsonError) {
                // If all else fails, store minimal info
                rawMessageSafe = JSON.stringify({
                  id: message.id,
                  text: messageText,
                  date: messageDate
                });
              }

              // Create message document
              const telegramMessage = new TelegramMessage({
                telegramGroupId: provider.groupId,
                providerId: provider._id,
                telegramMessageId: message.id,
                messageText: String(messageText), // Ensure it's a string
                senderId: senderId,
                senderUsername: senderUsername,
                messageDate: messageDate,
                rawMessage: rawMessageSafe,
              });

              // Try to save, handle duplicate key errors
              await telegramMessage.save();
              messagesStoredForProvider++;
              totalMessagesStored++;

            } catch (saveError: any) {
              // Check for duplicate key error (code 11000)
              if (saveError.code === 11000) {
                console.log(`[Telegram Collector] Message ${message.id} already exists, skipping`);
                continue;
              }
              console.error(`[Telegram Collector] Error saving message ${message.id}:`, saveError.message);
              console.error(`[Telegram Collector] Message data:`, JSON.stringify({
                id: message.id,
                message: message.message,
                text: message.text,
                senderUsername: message.senderUsername,
                date: message.date
              }));
              // Don't throw - continue with other messages
              continue;
            }
          }

          totalMessagesFetched += messages.length;

          // Only update checkpoint if all messages were stored successfully
          if (messagesStoredForProvider > 0) {
            // Get the highest message ID from the batch
            const maxMessageId = Math.max(...messages.map((m: any) => m.id));
            
            await TelegramProvider.findByIdAndUpdate(
              provider._id,
              { lastProcessedMessageId: maxMessageId }
            );
            
            console.log(`[Telegram Collector] Updated checkpoint for ${provider.groupName} to ${maxMessageId}`);
          }

        } catch (providerError: any) {
          console.error(`[Telegram Collector] Error processing provider ${provider.groupName}:`, providerError.message);
          // Continue with other providers even if one fails
          continue;
        }
      }

      // Disconnect from Telegram
      await client.disconnect();
      console.log('[Telegram Collector] Disconnected from Telegram');

      console.log(`[Telegram Collector] Finished - Providers: ${activeProviders.length}, Fetched: ${totalMessagesFetched}, Stored: ${totalMessagesStored}`);

      return NextResponse.json({
        success: true,
        providersScanned: activeProviders.length,
        messagesFetched: totalMessagesFetched,
        messagesStored: totalMessagesStored,
      });

    } catch (telegramError: any) {
      await client.disconnect();
      console.error('[Telegram Collector] Telegram error:', telegramError.message);
      
      return NextResponse.json({
        success: false,
        reason: 'telegram_error',
        error: telegramError.message,
      });
    }

  } catch (error) {
    console.error('[Telegram Collector] Error:', error);
    return NextResponse.json(
      { error: 'Failed to collect Telegram messages: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

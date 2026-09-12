import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAIMessage extends Document {
  _id: mongoose.Types.ObjectId;
  telegramMessageDbId: mongoose.Types.ObjectId; // Reference to the telegramMessages document
  telegramGroupId: string;
  providerId: mongoose.Types.ObjectId;
  telegramMessageId: number; // Telegram's numeric message ID
  originalMessageText: string;
  aiProvider: string;
  aiModel: string;
  promptVersion: string;
  aiResponseRaw: string; // Raw AI response text
  aiResponseParsed: any; // Parsed/structured result
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AIMessageSchema: Schema<IAIMessage> = new Schema(
  {
    telegramMessageDbId: {
      type: Schema.Types.ObjectId,
      ref: 'TelegramMessage',
      required: [true, 'Telegram message database ID is required'],
    },
    telegramGroupId: {
      type: String,
      required: [true, 'Telegram Group ID is required'],
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'TelegramProvider',
      required: [true, 'Provider ID is required'],
    },
    telegramMessageId: {
      type: Number,
      required: [true, 'Telegram Message ID is required'],
    },
    originalMessageText: {
      type: String,
      required: [true, 'Original message text is required'],
    },
    aiProvider: {
      type: String,
      required: [true, 'AI provider name is required'],
    },
    aiModel: {
      type: String,
      required: [true, 'AI model is required'],
    },
    promptVersion: {
      type: String,
      required: [true, 'Prompt version is required'],
    },
    aiResponseRaw: {
      type: String,
      required: false,
    },
    aiResponseParsed: {
      type: Schema.Types.Mixed,
      required: false,
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    errorMessage: {
      type: String,
    },
    processingStartedAt: {
      type: Date,
    },
    processingCompletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index on telegramGroupId + telegramMessageId to prevent duplicate AI processing
AIMessageSchema.index({ telegramGroupId: 1, telegramMessageId: 1 }, { unique: true });
// Index for status-based queries
AIMessageSchema.index({ processingStatus: 1 });
// Index for telegramMessageDbId reference
AIMessageSchema.index({ telegramMessageDbId: 1 });
// Index for provider lookup
AIMessageSchema.index({ providerId: 1 });
// Index for date-based queries
AIMessageSchema.index({ createdAt: -1 });

const AIMessage: Model<IAIMessage> = mongoose.models.AIMessage || mongoose.model<IAIMessage>('AIMessage', AIMessageSchema);

export default AIMessage;
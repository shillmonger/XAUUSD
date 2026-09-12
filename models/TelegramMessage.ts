import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITelegramMessage extends Document {
  _id: mongoose.Types.ObjectId;
  telegramGroupId: string;
  providerId: mongoose.Types.ObjectId;
  telegramMessageId: number;
  messageText: string;
  senderId?: number;
  senderUsername?: string;
  messageDate: Date;
  rawMessage: any;
  collectedAt: Date;
  createdAt: Date;
}

const TelegramMessageSchema: Schema<ITelegramMessage> = new Schema(
  {
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
    messageText: {
      type: String,
      required: [true, 'Message text is required'],
    },
    senderId: {
      type: Number,
    },
    senderUsername: {
      type: String,
    },
    messageDate: {
      type: Date,
      required: [true, 'Message date is required'],
    },
    rawMessage: {
      type: Schema.Types.Mixed,
      required: [true, 'Raw message data is required'],
    },
    collectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index on telegramGroupId + telegramMessageId to prevent duplicates
TelegramMessageSchema.index({ telegramGroupId: 1, telegramMessageId: 1 }, { unique: true });
// Index for provider lookup
TelegramMessageSchema.index({ providerId: 1 });
// Index for date-based queries
TelegramMessageSchema.index({ messageDate: -1 });

const TelegramMessage: Model<ITelegramMessage> = mongoose.models.TelegramMessage || mongoose.model<ITelegramMessage>('TelegramMessage', TelegramMessageSchema);

export default TelegramMessage;

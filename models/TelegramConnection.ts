import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITelegramConnection extends Document {
  _id: mongoose.Types.ObjectId;
  provider: string;
  telegramUserId: string;
  username?: string;
  firstName?: string;
  sessionEncrypted: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  connectedAt?: Date;
  lastCheckedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TelegramConnectionSchema: Schema<ITelegramConnection> = new Schema(
  {
    provider: {
      type: String,
      default: 'telegram',
    },
    telegramUserId: {
      type: String,
      required: [true, 'Telegram User ID is required'],
    },
    username: {
      type: String,
    },
    firstName: {
      type: String,
    },
    sessionEncrypted: {
      type: String,
      required: [true, 'Encrypted session is required'],
    },
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'connecting', 'error'],
      default: 'disconnected',
    },
    connectedAt: {
      type: Date,
    },
    lastCheckedAt: {
      type: Date,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick status lookups
TelegramConnectionSchema.index({ status: 1 });
// Unique index on telegramUserId
TelegramConnectionSchema.index({ telegramUserId: 1 });

const TelegramConnection: Model<ITelegramConnection> = mongoose.models.TelegramConnection || mongoose.model<ITelegramConnection>('TelegramConnection', TelegramConnectionSchema);

export default TelegramConnection;

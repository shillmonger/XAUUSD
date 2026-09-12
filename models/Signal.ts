import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISignal extends Document {
  _id: mongoose.Types.ObjectId;
  telegramMessageId: number;
  aiMessageId: mongoose.Types.ObjectId;
  telegramGroupId: string;
  providerId: mongoose.Types.ObjectId;
  symbol: string;
  direction: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP';
  entry: number | undefined;
  stopLoss: number;
  takeProfits: number[];
  validationStatus: 'valid' | 'rejected';
  validationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SignalSchema: Schema<ISignal> = new Schema(
  {
    telegramMessageId: {
      type: Number,
      required: [true, 'Telegram Message ID is required'],
    },
    aiMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'AIMessage',
      required: [true, 'AI Message ID is required'],
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
    symbol: {
      type: String,
      required: [true, 'Symbol is required'],
    },
    direction: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: [true, 'Direction is required'],
    },
    orderType: {
      type: String,
      enum: ['MARKET', 'LIMIT', 'STOP'],
      required: [true, 'Order type is required'],
    },
    entry: {
      type: Number,
      default: undefined,
    },
    stopLoss: {
      type: Number,
      required: [true, 'Stop loss is required'],
    },
    takeProfits: {
      type: [Number],
      required: [true, 'Take profits are required'],
    },
    validationStatus: {
      type: String,
      enum: ['valid', 'rejected'],
      required: [true, 'Validation status is required'],
    },
    validationReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index on telegramGroupId + telegramMessageId to prevent duplicate signals
SignalSchema.index({ telegramGroupId: 1, telegramMessageId: 1 }, { unique: true });
// Index for aiMessageId reference
SignalSchema.index({ aiMessageId: 1 });
// Index for provider lookup
SignalSchema.index({ providerId: 1 });
// Index for validation status
SignalSchema.index({ validationStatus: 1 });
// Index for date-based queries
SignalSchema.index({ createdAt: -1 });

const Signal: Model<ISignal> = mongoose.models.Signal || mongoose.model<ISignal>('Signal', SignalSchema);

export default Signal;

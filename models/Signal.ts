import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISignal extends Document {
  _id: mongoose.Types.ObjectId;
  telegramMessageId: number;
  aiMessageId: mongoose.Types.ObjectId;
  telegramGroupId: string;
  providerId: mongoose.Types.ObjectId;
  
  // Renamed fields for Deriv Multipliers architecture
  asset: string;  // was: symbol
  sourceOrderType: 'MARKET' | 'LIMIT' | 'STOP';  // was: orderType
  sourceEntryPrice: number | undefined;  // was: entry
  
  direction: 'BUY' | 'SELL';
  stopLoss: number;
  takeProfits: number[];  // Keep as array for audit
  stake?: number;  // was: lotSize
  
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
    // Renamed fields for Deriv Multipliers architecture
    asset: {
      type: String,
      required: [true, 'Asset is required'],
    },
    direction: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: [true, 'Direction is required'],
    },
    sourceOrderType: {
      type: String,
      enum: ['MARKET', 'LIMIT', 'STOP'],
      required: [true, 'Source order type is required'],
    },
    sourceEntryPrice: {
      type: Number,
      default: undefined,
    },
    stake: {
      type: Number,
    },
    stopLoss: {
      type: Number,
      required: [true, 'Stop loss is required'],
    },
    takeProfits: {
      type: [Number],
      required: [true, 'Take profits are required'],
    },  // Keep as array for audit - single TP selected during execution
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
// Index for asset lookup
SignalSchema.index({ asset: 1 });
// Index for source order type
SignalSchema.index({ sourceOrderType: 1 });

const Signal: Model<ISignal> = mongoose.models.Signal || mongoose.model<ISignal>('Signal', SignalSchema);

export default Signal;

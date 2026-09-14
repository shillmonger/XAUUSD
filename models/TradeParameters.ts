import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITradeParameters extends Document {
  _id: mongoose.Types.ObjectId;
  signalId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  derivAccountId: string;
  
  // Balance information
  currentBalance: number;
  databaseBalance: number;
  balanceSynchronized: boolean;
  
  // Original Telegram signal values (for audit)
  telegramStopLoss: number;
  telegramTakeProfits: number[];
  telegramStake?: number;  // was: telegramLotSize
  
  // Admin-configured values
  configuredStake?: number;  // was: configuredLotSize
  configuredStopLoss?: number;
  configuredMaxPositions?: number;
  configuredMultiplier?: number;  // NEW
  configuredMaxRiskAmount?: number;  // NEW
  
  // Final execution parameters
  finalStopLoss?: number;
  finalTakeProfit?: number;
  finalStake?: number;  // was: finalLotSize
  finalMultiplier?: number;  // NEW
  finalCurrency?: string;  // NEW
  finalTakeProfitIndex?: number;  // NEW
  
  // Position management
  currentOpenPositions: number;
  maxPositions?: number;
  positionLimitReached: boolean;
  
  // Eligibility
  eligible: boolean;
  rejectionReason?: string;
  
  // Processing metadata
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TradeParametersSchema: Schema<ITradeParameters> = new Schema(
  {
    signalId: {
      type: Schema.Types.ObjectId,
      ref: 'Signal',
      required: [true, 'Signal ID is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    derivAccountId: {
      type: String,
      required: [true, 'Deriv Account ID is required'],
    },
    
    // Balance information
    currentBalance: {
      type: Number,
      required: [true, 'Current balance is required'],
    },
    databaseBalance: {
      type: Number,
      required: [true, 'Database balance is required'],
    },
    balanceSynchronized: {
      type: Boolean,
      default: false,
    },
    
    // Original Telegram signal values (for audit)
    telegramStopLoss: {
      type: Number,
      required: [true, 'Telegram stop loss is required'],
    },
    telegramTakeProfits: {
      type: [Number],
      required: [true, 'Telegram take profits are required'],
    },
    telegramStake: {
      type: Number,
    },
    
    // Admin-configured values
    configuredStake: {
      type: Number,
    },
    configuredStopLoss: {
      type: Number,
    },
    configuredMaxPositions: {
      type: Number,
    },
    configuredMultiplier: {
      type: Number,
    },
    configuredMaxRiskAmount: {
      type: Number,
    },
    
    // Final execution parameters
    finalStopLoss: {
      type: Number,
    },
    finalTakeProfit: {
      type: Number,
    },
    finalStake: {
      type: Number,
    },
    finalMultiplier: {
      type: Number,
    },
    finalCurrency: {
      type: String,
    },
    finalTakeProfitIndex: {
      type: Number,
    },
    
    // Position management
    currentOpenPositions: {
      type: Number,
      default: 0,
    },
    maxPositions: {
      type: Number,
    },
    positionLimitReached: {
      type: Boolean,
      default: false,
    },
    
    // Eligibility
    eligible: {
      type: Boolean,
      required: [true, 'Eligibility status is required'],
    },
    rejectionReason: {
      type: String,
    },
    
    // Processing metadata
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index on signalId + userId to prevent duplicate processing
TradeParametersSchema.index({ signalId: 1, userId: 1 }, { unique: true });
// Index for userId lookup
TradeParametersSchema.index({ userId: 1 });
// Index for derivAccountId lookup
TradeParametersSchema.index({ derivAccountId: 1 });
// Index for eligibility status
TradeParametersSchema.index({ eligible: 1 });
// Index for date-based queries
TradeParametersSchema.index({ processedAt: -1 });

const TradeParameters: Model<ITradeParameters> = mongoose.models.TradeParameters || mongoose.model<ITradeParameters>('TradeParameters', TradeParametersSchema);

export default TradeParameters;
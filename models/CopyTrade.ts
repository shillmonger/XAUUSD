import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICopyTrade extends Document {
  _id: mongoose.Types.ObjectId;
  signalId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  derivAccountId: string;
  
  // Broker information
  broker: string;
  accountType: 'demo' | 'real';
  
  // ORIGINAL SIGNAL INTENT (Preserve for Audit)
  asset: string;  // was: symbol
  direction: 'BUY' | 'SELL';
  sourceOrderType: 'MARKET' | 'LIMIT' | 'STOP';  // was: orderType
  sourceEntryPrice?: number;  // was: requestedEntry
  stopLoss?: number;
  takeProfit?: number;  // Single executed TP
  takeProfits?: number[];  // All original TPs for audit
  stake?: number;  // was: lotSize
  
  // DERIV EXECUTION DETAILS (NEW - Multipliers only)
  derivUnderlyingSymbol?: string;
  derivContractType?: string;  // MULTUP/MULTDOWN only
  legacyDerivContractType?: string;  // Historical Options (CALL/PUT)
  multiplier?: number;
  currency?: string;
  proposalId?: string;
  contractId?: string;  // was: brokerContractId
  buyPrice?: number;
  referenceSpot?: number;  // Used for SL/TP calculation
  actualEntrySpot?: number;  // Actual execution price
  contractStatus?: string;
  actualDerivStopLossAmount?: number;
  actualDerivTakeProfitAmount?: number;
  sltpConversionMethod?: string;
  sltpValidationStatus?: 'CANDIDATE' | 'DEMO_VALIDATED' | 'PRODUCTION_READY';
  
  // Legacy fields (keep for backward compatibility)
  executionPrice?: number;  // DEPRECATED: use actualEntrySpot
  requestedEntry?: number;  // DEPRECATED: use sourceEntryPrice
  lotSize?: number;  // DEPRECATED: use stake
  brokerContractId?: string;  // DEPRECATED: use contractId
  brokerTransactionId?: string;
  
  // Trade status
  status: 'PENDING' | 'OPEN' | 'CLOSED' | 'FAILED' | 'CANCELLED' | 'REJECTED_LIMIT_NOT_SUPPORTED';
  failureReason?: string;
  brokerErrorCode?: string;
  
  // Lifecycle tracking
  openedAt?: Date;
  closedAt?: Date;
  profitLoss?: number;
  
  // Processing metadata
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CopyTradeSchema: Schema<ICopyTrade> = new Schema(
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
    
    // Broker information
    broker: {
      type: String,
      default: 'deriv',
    },
    accountType: {
      type: String,
      enum: ['demo', 'real'],
      required: [true, 'Account type is required'],
    },
    
    // ORIGINAL SIGNAL INTENT (Preserve for Audit)
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
    },
    stopLoss: {
      type: Number,
    },
    takeProfit: {
      type: Number,
    },
    takeProfits: {
      type: [Number],
    },
    stake: {
      type: Number,
    },
    
    // DERIV EXECUTION DETAILS (NEW - Multipliers only)
    derivUnderlyingSymbol: {
      type: String,
    },
    derivContractType: {
      type: String,
    },
    legacyDerivContractType: {
      type: String,
    },
    multiplier: {
      type: Number,
    },
    currency: {
      type: String,
    },
    proposalId: {
      type: String,
    },
    contractId: {
      type: String,
    },
    buyPrice: {
      type: Number,
    },
    referenceSpot: {
      type: Number,
    },
    actualEntrySpot: {
      type: Number,
    },
    contractStatus: {
      type: String,
    },
    actualDerivStopLossAmount: {
      type: Number,
    },
    actualDerivTakeProfitAmount: {
      type: Number,
    },
    sltpConversionMethod: {
      type: String,
    },
    sltpValidationStatus: {
      type: String,
      enum: ['CANDIDATE', 'DEMO_VALIDATED', 'PRODUCTION_READY'],
    },
    
    // Legacy fields (keep for backward compatibility)
    executionPrice: {
      type: Number,
    },
    requestedEntry: {
      type: Number,
    },
    lotSize: {
      type: Number,
    },
    brokerContractId: {
      type: String,
    },
    brokerTransactionId: {
      type: String,
    },
    
    // Trade status
    status: {
      type: String,
      enum: ['PENDING', 'OPEN', 'CLOSED', 'FAILED', 'CANCELLED', 'REJECTED_LIMIT_NOT_SUPPORTED'],
      default: 'PENDING',
    },
    failureReason: {
      type: String,
    },
    brokerErrorCode: {
      type: String,
    },
    
    // Lifecycle tracking
    openedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
    profitLoss: {
      type: Number,
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

// Unique index on signalId + userId + derivAccountId to prevent duplicate execution
CopyTradeSchema.index({ signalId: 1, userId: 1, derivAccountId: 1 }, { unique: true });
// Index for userId lookup
CopyTradeSchema.index({ userId: 1 });
// Index for derivAccountId lookup
CopyTradeSchema.index({ derivAccountId: 1 });
// Index for status filtering
CopyTradeSchema.index({ status: 1 });
// Index for account type filtering
CopyTradeSchema.index({ accountType: 1 });
// Index for contract ID lookup
CopyTradeSchema.index({ contractId: 1 });
// Index for date-based queries
CopyTradeSchema.index({ processedAt: -1 });
// Index for open trades monitoring
CopyTradeSchema.index({ status: 1, accountType: 1 });
// Index for asset lookup
CopyTradeSchema.index({ asset: 1 });
// Index for source order type
CopyTradeSchema.index({ sourceOrderType: 1 });

const CopyTrade: Model<ICopyTrade> = mongoose.models.CopyTrade || mongoose.model<ICopyTrade>('CopyTrade', CopyTradeSchema);

export default CopyTrade;

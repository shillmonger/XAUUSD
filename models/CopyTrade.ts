import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICopyTrade extends Document {
  _id: mongoose.Types.ObjectId;
  signalId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  derivAccountId: string;
  
  // Broker information
  broker: string;
  platform: 'mt5' | 'options' | 'unknown';
  product: 'cfd' | 'options' | 'multipliers' | 'unknown';
  accountType: 'demo' | 'real';
  
  // ORIGINAL SIGNAL INTENT (Preserve for Audit)
  asset: string;  // XAUUSD
  direction: 'BUY' | 'SELL';
  sourceOrderType: 'MARKET' | 'LIMIT' | 'STOP';
  sourceEntryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;  // Single executed TP
  takeProfits?: number[];  // All original TPs for audit
  stake?: number;  // Amount to trade
  
  // MT5/CFD EXECUTION DETAILS
  mt5Symbol?: string;  // MT5 symbol format (e.g., XAUUSD)
  mt5PositionId?: string;  // MT5 position/ticket ID
  mt5ExecutionId?: string;  // MT5 execution ID
  mt5Volume?: number;  // MT5 lot size
  mt5EntryPrice?: number;  // Actual MT5 entry price
  mt5StopLoss?: number;  // Actual MT5 stop loss
  mt5TakeProfit?: number;  // Actual MT5 take profit
  mt5Server?: string;  // MT5 server
  mt5Login?: string;  // MT5 login
  mt5Profit?: number;  // Current profit/loss
  
  // MT5 Signal Queue Integration
  mt5SignalId?: string;  // ID of signal in MT5 queue
  sentToMT5At?: Date;  // When signal was sent to MT5 EA
  mt5ExecutionStatus?: 'pending' | 'sent' | 'executed' | 'failed';
  
  // LEGACY OPTIONS/MULTIPLIERS DETAILS (Deprecated - kept for historical records)
  derivUnderlyingSymbol?: string;
  derivContractType?: string;  // MULTUP/MULTDOWN (deprecated)
  legacyDerivContractType?: string;  // Historical Options CALL/PUT (deprecated)
  multiplier?: number;  // Deprecated
  currency?: string;
  proposalId?: string;  // Deprecated
  contractId?: string;  // Deprecated Options contract ID
  buyPrice?: number;  // Deprecated
  referenceSpot?: number;  // Deprecated
  actualEntrySpot?: number;  // Deprecated
  contractStatus?: string;  // Deprecated
  actualDerivStopLossAmount?: number;  // Deprecated
  actualDerivTakeProfitAmount?: number;  // Deprecated
  sltpConversionMethod?: string;  // Deprecated
  sltpValidationStatus?: 'CANDIDATE' | 'DEMO_VALIDATED' | 'PRODUCTION_READY';  // Deprecated
  
  // Legacy fields (keep for backward compatibility)
  executionPrice?: number;  // DEPRECATED: use mt5EntryPrice
  requestedEntry?: number;  // DEPRECATED: use sourceEntryPrice
  lotSize?: number;  // DEPRECATED: use stake
  brokerContractId?: string;  // DEPRECATED: use mt5PositionId
  brokerTransactionId?: string;  // DEPRECATED: use mt5ExecutionId
  
  // Trade status
  status: 'PENDING' | 'SENT_TO_MT5' | 'OPEN' | 'CLOSED' | 'FAILED' | 'CANCELLED' | 'REJECTED_LIMIT_NOT_SUPPORTED';
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
    platform: {
      type: String,
      enum: ['mt5', 'unknown'],
      default: 'unknown',
    },
    product: {
      type: String,
      enum: ['cfd', 'unknown'],
      default: 'unknown',
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
    
    // MT5/CFD EXECUTION DETAILS
    mt5Symbol: {
      type: String,
    },
    mt5PositionId: {
      type: String,
    },
    mt5ExecutionId: {
      type: String,
    },
    mt5Volume: {
      type: Number,
    },
    mt5EntryPrice: {
      type: Number,
    },
    mt5StopLoss: {
      type: Number,
    },
    mt5TakeProfit: {
      type: Number,
    },
    mt5Server: {
      type: String,
    },
    mt5Login: {
      type: String,
    },
    mt5Profit: {
      type: Number,
    },
    
    // MT5 Signal Queue Integration
    mt5SignalId: {
      type: String,
    },
    sentToMT5At: {
      type: Date,
    },
    mt5ExecutionStatus: {
      type: String,
      enum: ['pending', 'sent', 'executed', 'failed'],
    },
    
    // LEGACY OPTIONS/MULTIPLIERS DETAILS (Deprecated - kept for historical records)
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
      enum: ['PENDING', 'SENT_TO_MT5', 'OPEN', 'CLOSED', 'FAILED', 'CANCELLED', 'REJECTED_LIMIT_NOT_SUPPORTED'],
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
// Index for platform/product filtering
CopyTradeSchema.index({ platform: 1, product: 1 });
// Index for status filtering
CopyTradeSchema.index({ status: 1 });
// Index for account type filtering
CopyTradeSchema.index({ accountType: 1 });
// Index for MT5-specific lookups
CopyTradeSchema.index({ mt5PositionId: 1 });
CopyTradeSchema.index({ mt5ExecutionId: 1 });
CopyTradeSchema.index({ mt5SignalId: 1 });
// Index for contract ID lookup (legacy, kept for backward compatibility)
CopyTradeSchema.index({ contractId: 1 });
// Index for date-based queries
CopyTradeSchema.index({ processedAt: -1 });
// Index for open trades monitoring
CopyTradeSchema.index({ status: 1, accountType: 1, platform: 1 });
// Index for asset lookup
CopyTradeSchema.index({ asset: 1 });
// Index for source order type
CopyTradeSchema.index({ sourceOrderType: 1 });
// Index for MT5 execution status tracking
CopyTradeSchema.index({ mt5ExecutionStatus: 1, sentToMT5At: 1 });

const CopyTrade: Model<ICopyTrade> = mongoose.models.CopyTrade || mongoose.model<ICopyTrade>('CopyTrade', CopyTradeSchema);

export default CopyTrade;

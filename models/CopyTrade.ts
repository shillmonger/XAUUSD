import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICopyTrade extends Document {
  _id: mongoose.Types.ObjectId;
  signalId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  derivAccountId: string;
  
  // Broker information
  broker: string;
  accountType: 'demo' | 'real';
  
  // Trade parameters
  symbol: string;
  direction: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP';
  requestedEntry?: number;
  executionPrice?: number;
  
  // Risk management
  stopLoss?: number;
  takeProfit?: number;
  lotSize?: number;
  
  // Broker identifiers
  brokerContractId?: string;
  brokerTransactionId?: string;
  
  // Trade status
  status: 'PENDING' | 'OPEN' | 'CLOSED' | 'FAILED' | 'CANCELLED';
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
    
    // Trade parameters
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
    requestedEntry: {
      type: Number,
    },
    executionPrice: {
      type: Number,
    },
    
    // Risk management
    stopLoss: {
      type: Number,
    },
    takeProfit: {
      type: Number,
    },
    lotSize: {
      type: Number,
    },
    
    // Broker identifiers
    brokerContractId: {
      type: String,
    },
    brokerTransactionId: {
      type: String,
    },
    
    // Trade status
    status: {
      type: String,
      enum: ['PENDING', 'OPEN', 'CLOSED', 'FAILED', 'CANCELLED'],
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
// Index for broker contract ID lookup
CopyTradeSchema.index({ brokerContractId: 1 });
// Index for date-based queries
CopyTradeSchema.index({ processedAt: -1 });
// Index for open trades monitoring
CopyTradeSchema.index({ status: 1, accountType: 1 });

const CopyTrade: Model<ICopyTrade> = mongoose.models.CopyTrade || mongoose.model<ICopyTrade>('CopyTrade', CopyTradeSchema);

export default CopyTrade;

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserEligibility extends Document {
  _id: mongoose.Types.ObjectId;
  signalId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  derivAccountId: string;
  
  // Account type for filtering
  accountType: 'demo' | 'real';
  
  // Connection and bot status checks
  connectionStatus: 'connected' | 'disconnected' | 'pending';
  botStatus: 'ACTIVE' | 'PAUSED' | 'OFF';
  
  // Phase 5 trade parameters reference
  tradeParametersId: mongoose.Types.ObjectId;
  
  // Final eligibility decision
  eligible: boolean;
  rejectionReason?: string;
  
  // Processing metadata
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserEligibilitySchema: Schema<IUserEligibility> = new Schema(
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
    
    // Account type for filtering
    accountType: {
      type: String,
      enum: ['demo', 'real'],
      required: [true, 'Account type is required'],
    },
    
    // Connection and bot status checks
    connectionStatus: {
      type: String,
      enum: ['connected', 'disconnected', 'pending'],
      required: [true, 'Connection status is required'],
    },
    botStatus: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'OFF'],
      required: [true, 'Bot status is required'],
    },
    
    // Phase 5 trade parameters reference
    tradeParametersId: {
      type: Schema.Types.ObjectId,
      ref: 'TradeParameters',
      required: [true, 'Trade Parameters ID is required'],
    },
    
    // Final eligibility decision
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

// Unique index on signalId + userId + derivAccountId to prevent duplicate processing
UserEligibilitySchema.index({ signalId: 1, userId: 1, derivAccountId: 1 }, { unique: true });
// Index for userId lookup
UserEligibilitySchema.index({ userId: 1 });
// Index for derivAccountId lookup
UserEligibilitySchema.index({ derivAccountId: 1 });
// Index for eligibility status
UserEligibilitySchema.index({ eligible: 1 });
// Index for account type filtering
UserEligibilitySchema.index({ accountType: 1 });
// Index for date-based queries
UserEligibilitySchema.index({ processedAt: -1 });

const UserEligibility: Model<IUserEligibility> = mongoose.models.UserEligibility || mongoose.model<IUserEligibility>('UserEligibility', UserEligibilitySchema);

export default UserEligibility;

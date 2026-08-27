import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDerivAccount extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  broker: string;
  derivAccountId: string;
  accountType: 'demo' | 'real';
  connectionStatus: 'connected' | 'disconnected' | 'pending';
  accessTokenEncrypted: string;
  tokenExpiresAt: Date;
  connectedAt: Date;
  lastVerifiedAt: Date;
  disconnectedAt?: Date;
  // Additional account details from Deriv API
  balance?: string;
  currency?: string;
  accountStatus?: string;
  group?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DerivAccountSchema: Schema<IDerivAccount> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    broker: {
      type: String,
      default: 'deriv',
    },
    derivAccountId: {
      type: String,
      required: [true, 'Deriv Account ID is required'],
      unique: true,
    },
    accountType: {
      type: String,
      enum: ['demo', 'real'],
      required: [true, 'Account type is required'],
    },
    connectionStatus: {
      type: String,
      enum: ['connected', 'disconnected', 'pending'],
      default: 'pending',
    },
    accessTokenEncrypted: {
      type: String,
      required: [true, 'Access token is required'],
    },
    tokenExpiresAt: {
      type: Date,
      required: [true, 'Token expiration is required'],
    },
    connectedAt: {
      type: Date,
    },
    lastVerifiedAt: {
      type: Date,
    },
    disconnectedAt: {
      type: Date,
    },
    // Additional account details from Deriv API
    balance: {
      type: String,
    },
    currency: {
      type: String,
    },
    accountStatus: {
      type: String,
    },
    group: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for user lookups
DerivAccountSchema.index({ userId: 1 });

const DerivAccount: Model<IDerivAccount> = mongoose.models.DerivAccount || mongoose.model<IDerivAccount>('DerivAccount', DerivAccountSchema);

export default DerivAccount;

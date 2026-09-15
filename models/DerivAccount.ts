import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDerivAccount extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  broker: string;
  derivAccountId: string;
  accountType: 'demo' | 'real';
  accountPlatform: 'mt5' | 'options' | 'unknown';
  product: 'cfd' | 'options' | 'multipliers' | 'unknown';
  connectionStatus: 'connected' | 'disconnected' | 'pending' | 'invalid';
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
  // MT5/CFD specific fields
  mt5Login?: string;
  mt5Server?: string;
  mt5AccountType?: 'demo' | 'real';
  bridgePairingTokenHash?: string;
  // Bot execution state
  botStatus?: 'ACTIVE' | 'PAUSED' | 'OFF';
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
    },
    accountType: {
      type: String,
      enum: ['demo', 'real'],
      required: [true, 'Account type is required'],
    },
    accountPlatform: {
      type: String,
      enum: ['mt5', 'unknown'],
      default: 'unknown',
    },
    product: {
      type: String,
      enum: ['cfd', 'unknown'],
      default: 'unknown',
    },
    connectionStatus: {
      type: String,
      enum: ['connected', 'disconnected', 'pending', 'invalid'],
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
    // MT5/CFD specific fields
    mt5Login: {
      type: String,
    },
    mt5Server: {
      type: String,
    },
    mt5AccountType: {
      type: String,
      enum: ['demo', 'real'],
    },
    bridgePairingTokenHash: {
      type: String,
      select: false,
    },
    // Bot execution state
    botStatus: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'OFF'],
      default: 'OFF',
    },
  },
  {
    timestamps: true,
  }
);

// Index for user lookups
DerivAccountSchema.index({ userId: 1 });

// Compound unique index to ensure one MT5 account per user per type
DerivAccountSchema.index({ userId: 1, accountType: 1, accountPlatform: 1 }, { unique: true, partialFilterExpression: { accountPlatform: 'mt5' } });

// Index for legacy Options accounts (marked as invalid)
DerivAccountSchema.index({ userId: 1, accountType: 1, accountPlatform: 1 }, { partialFilterExpression: { accountPlatform: 'options' } });

const DerivAccount: Model<IDerivAccount> = mongoose.models.DerivAccount || mongoose.model<IDerivAccount>('DerivAccount', DerivAccountSchema);

export default DerivAccount;

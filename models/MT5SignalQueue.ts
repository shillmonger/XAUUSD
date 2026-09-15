/**
 * MT5 Signal Queue Model
 *
 * Stores pending XAUUSD CFD trade signals that are waiting for execution
 * by an MT5 Expert Advisor (EA).
 *
 * Lifecycle:
 *   pending    → Signal stored, EA has not yet picked it up.
 *   sent       → EA acknowledged the signal (optional intermediate state).
 *   executed   → EA confirmed a position was opened; positionId is set.
 *   failed     → EA reported an execution error.
 *   expired    → Signal was not picked up before expiresAt.
 *
 * EA integration:
 *   Poll:    GET  /api/deriv/mt5/signals?mt5Login=<login>&status=pending
 *   Report:  POST /api/deriv/mt5/signals/[signalId]/result
 *
 * IMPORTANT: No Options/Multipliers fields exist in this model.
 * This model represents MT5 CFD positions exclusively.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMT5SignalQueue extends Document {
  _id: mongoose.Types.ObjectId;

  // Signal identity
  signalId: string;   // References CopyTrade.mt5SignalId
  userId: string;

  // MT5 account details (verified at enqueue time)
  mt5Login: string;
  mt5Server: string;
  accountType: 'demo' | 'real';

  // XAUUSD CFD trade parameters
  symbol: string;           // e.g. 'XAUUSD'
  side: 'BUY' | 'SELL';
  volume: number;           // Lot size, e.g. 0.01
  entryPrice?: number;      // Desired entry (market order if omitted)
  stopLoss: number;         // Price-level stop loss
  takeProfit: number;       // Price-level take profit

  // Queue status
  status: 'pending' | 'sent' | 'executed' | 'failed' | 'expired';

  // EA execution result (filled when EA reports back)
  positionId?: string;       // MT5 position/ticket ID
  executionPrice?: number;   // Actual fill price
  executionError?: string;   // Error message from EA
  executedAt?: Date;

  // Metadata
  source: string;            // e.g. 'telegram_signal'
  expiresAt?: Date;          // Signal TTL — EA should not execute after this time
  createdAt: Date;
  updatedAt: Date;
}

const MT5SignalQueueSchema: Schema<IMT5SignalQueue> = new Schema(
  {
    signalId: {
      type: String,
      required: [true, 'Signal ID is required'],
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },

    // MT5 account
    mt5Login: {
      type: String,
      required: [true, 'MT5 login is required'],
      index: true,
    },
    mt5Server: {
      type: String,
      required: [true, 'MT5 server is required'],
    },
    accountType: {
      type: String,
      enum: ['demo', 'real'],
      required: [true, 'Account type is required'],
    },

    // XAUUSD CFD trade parameters
    symbol: {
      type: String,
      required: [true, 'Symbol is required'],
      default: 'XAUUSD',
    },
    side: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: [true, 'Side is required'],
    },
    volume: {
      type: Number,
      required: [true, 'Volume (lot size) is required'],
      min: [0.01, 'Minimum volume is 0.01 lots'],
    },
    entryPrice: {
      type: Number,
    },
    stopLoss: {
      type: Number,
      required: [true, 'Stop loss is required'],
    },
    takeProfit: {
      type: Number,
      required: [true, 'Take profit is required'],
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'sent', 'executed', 'failed', 'expired'],
      default: 'pending',
      index: true,
    },

    // EA execution result
    positionId: { type: String },
    executionPrice: { type: Number },
    executionError: { type: String },
    executedAt: { type: Date },

    // Metadata
    source: {
      type: String,
      default: 'telegram_signal',
    },
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 },  // MongoDB TTL index — auto-delete expired docs
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: EA queries by mt5Login + status
MT5SignalQueueSchema.index({ mt5Login: 1, status: 1 });
// Allow sorting by creation time per account
MT5SignalQueueSchema.index({ mt5Login: 1, createdAt: 1 });

const MT5SignalQueue: Model<IMT5SignalQueue> =
  mongoose.models.MT5SignalQueue ||
  mongoose.model<IMT5SignalQueue>('MT5SignalQueue', MT5SignalQueueSchema);

export default MT5SignalQueue;

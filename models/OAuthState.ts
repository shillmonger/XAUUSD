import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOAuthState extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  state: string;
  codeVerifier: string;
  codeChallenge: string;
  targetAccountType?: 'demo' | 'real';
  expiresAt: Date;
  createdAt: Date;
}

const OAuthStateSchema: Schema<IOAuthState> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      unique: true,
    },
    codeVerifier: {
      type: String,
      required: [true, 'Code verifier is required'],
    },
    codeChallenge: {
      type: String,
      required: [true, 'Code challenge is required'],
    },
    targetAccountType: {
      type: String,
      enum: ['demo', 'real'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration time is required'],
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  },
  {
    timestamps: true,
  }
);

// Index for cleanup of expired states
OAuthStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OAuthState: Model<IOAuthState> = mongoose.models.OAuthState || mongoose.model<IOAuthState>('OAuthState', OAuthStateSchema);

export default OAuthState;

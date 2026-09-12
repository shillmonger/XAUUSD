import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITelegramProvider extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: string;
  groupName: string;
  profileImage: string;
  type: 'group' | 'channel';
  username?: string;
  isActive: boolean;
  lastProcessedMessageId: number;
  createdAt: Date;
  updatedAt: Date;
}

const TelegramProviderSchema: Schema<ITelegramProvider> = new Schema(
  {
    groupId: {
      type: String,
      required: [true, 'Group ID is required'],
      unique: true,
    },
    groupName: {
      type: String,
      required: [true, 'Group name is required'],
    },
    profileImage: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['group', 'channel'],
      default: 'group',
    },
    username: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastProcessedMessageId: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index on groupId to prevent duplicates
TelegramProviderSchema.index({ groupId: 1 }, { unique: true });
// Index for active providers lookup
TelegramProviderSchema.index({ isActive: 1 });

const TelegramProvider: Model<ITelegramProvider> = mongoose.models.TelegramProvider || mongoose.model<ITelegramProvider>('TelegramProvider', TelegramProviderSchema);

export default TelegramProvider;

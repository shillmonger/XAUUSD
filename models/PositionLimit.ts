import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPositionLimit extends Document {
  min_balance: number;
  max_balance: number;
  max_positions: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PositionLimitSchema: Schema = new Schema(
  {
    min_balance: {
      type: Number,
      required: true,
    },
    max_balance: {
      type: Number,
      required: true,
    },
    max_positions: {
      type: Number,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const PositionLimit: Model<IPositionLimit> = mongoose.models.PositionLimit || mongoose.model<IPositionLimit>('PositionLimit', PositionLimitSchema);

export default PositionLimit;

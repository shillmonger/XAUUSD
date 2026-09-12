import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILotSizeManagement extends Document {
  min_balance: number;
  max_balance: number;
  lot_size: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LotSizeManagementSchema: Schema = new Schema(
  {
    min_balance: {
      type: Number,
      required: true,
    },
    max_balance: {
      type: Number,
      required: true,
    },
    lot_size: {
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

const LotSizeManagement: Model<ILotSizeManagement> = mongoose.models.LotSizeManagement || mongoose.model<ILotSizeManagement>('LotSizeManagement', LotSizeManagementSchema);

export default LotSizeManagement;

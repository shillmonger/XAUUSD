import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStopLossManagement extends Document {
  min_balance: number;
  max_balance: number;
  stop_loss: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StopLossManagementSchema: Schema = new Schema(
  {
    min_balance: {
      type: Number,
      required: true,
    },
    max_balance: {
      type: Number,
      required: true,
    },
    stop_loss: {
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

const StopLossManagement: Model<IStopLossManagement> = mongoose.models.StopLossManagement || mongoose.model<IStopLossManagement>('StopLossManagement', StopLossManagementSchema);

export default StopLossManagement;

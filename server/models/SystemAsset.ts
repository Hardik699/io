import mongoose, { Schema, Document } from "mongoose";

export interface ISystemAsset extends Document {
  id: string;
  category: string;
  serialNumber: string;
  vendorName: string;
  companyName?: string;
  purchaseDate: string;
  warrantyEndDate: string;
  vonageNumber?: string;
  vonageExtCode?: string;
  vonagePassword?: string;
  ramSize?: string;
  ramType?: string;
  processorModel?: string;
  storageType?: string;
  storageCapacity?: string;
  createdAt: Date;
  updatedAt: Date;
}

const systemAssetSchema = new Schema<ISystemAsset>(
  {
    id: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    serialNumber: { type: String, required: true },
    vendorName: { type: String, required: true },
    companyName: String,
    purchaseDate: { type: String, required: true },
    warrantyEndDate: { type: String, required: true },
    vonageNumber: String,
    vonageExtCode: String,
    vonagePassword: String,
    ramSize: String,
    ramType: String,
    processorModel: String,
    storageType: String,
    storageCapacity: String,
  },
  { timestamps: true },
);

export const SystemAsset =
  mongoose.models.SystemAsset ||
  mongoose.model<ISystemAsset>("SystemAsset", systemAssetSchema);

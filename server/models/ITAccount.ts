import mongoose, { Schema, Document } from "mongoose";

export interface IITAccount extends Document {
  employeeId: string;
  employeeName: string;
  systemId: string;
  tableNumber: string;
  department: string;
  emails: Array<{ email: string; password: string }>;
  vitelGlobal: {
    id?: string;
    provider?: "vitel" | "vonage";
    type?: string;
    extNumber?: string;
    password?: string;
  };
  lmPlayer: { id: string; password: string; license: string };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const itAccountSchema = new Schema<IITAccount>(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    systemId: { type: String, required: true, unique: true },
    tableNumber: String,
    department: String,
    emails: [
      {
        email: { type: String, required: true },
        password: { type: String, required: true },
      },
    ],
    vitelGlobal: {
      id: String,
      provider: { type: String, enum: ["vitel", "vonage"] },
      type: String,
      extNumber: String,
      password: String,
    },
    lmPlayer: {
      id: { type: String, required: true },
      password: { type: String, required: true },
      license: String,
    },
    notes: String,
  },
  { timestamps: true }
);

export const ITAccount =
  mongoose.models.ITAccount ||
  mongoose.model<IITAccount>("ITAccount", itAccountSchema);

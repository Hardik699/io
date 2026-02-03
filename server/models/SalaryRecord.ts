import mongoose, { Schema, Document } from "mongoose";

export interface ISalaryRecord extends Document {
  employeeId: string;
  month: string; // YYYY-MM format
  year: number;
  totalWorkingDays: number;
  actualWorkingDays: number;
  basicSalary: number;
  bonus?: number;
  deductions?: number;
  totalSalary: number;
  paymentDate?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const salaryRecordSchema = new Schema<ISalaryRecord>(
  {
    employeeId: { type: String, required: true },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    totalWorkingDays: { type: Number, required: true },
    actualWorkingDays: { type: Number, required: true },
    basicSalary: { type: Number, required: true },
    bonus: Number,
    deductions: Number,
    totalSalary: { type: Number, required: true },
    paymentDate: String,
    notes: String,
  },
  { timestamps: true }
);

// Create compound index for employeeId and month
salaryRecordSchema.index({ employeeId: 1, month: 1 }, { unique: true });

export const SalaryRecord =
  mongoose.models.SalaryRecord ||
  mongoose.model<ISalaryRecord>("SalaryRecord", salaryRecordSchema);

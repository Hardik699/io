import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: "admin" | "hr" | "it" | "user";
  email?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(plainPassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: 60, // bcrypt hash length
    },
    role: {
      type: String,
      enum: ["admin", "hr", "it", "user"],
      default: "user",
      required: true,
    },
    email: {
      type: String,
      lowercase: true,
      sparse: true,
    },
  },
  { timestamps: true },
);

// Hash password before saving
UserSchema.pre("save", async function () {
  // Only hash if password has been modified
  if (!this.isModified("passwordHash")) {
    return;
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(this.passwordHash, salt);
    this.passwordHash = hashed;
  } catch (error) {
    throw error;
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  plainPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Remove password hash from JSON responses
UserSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

export const User = mongoose.model<IUser>("User", UserSchema);

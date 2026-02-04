import mongoose from "mongoose";
import { User } from "./models/User";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;

// Create initial admin user if none exists
async function createInitialAdminIfNeeded() {
  try {
    const existingAdmin = await User.findOne({ role: "admin" });

    if (!existingAdmin) {
      // Create default admin user
      const adminPassword = "Admin@123"; // Default password - MUST BE CHANGED
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      const admin = new User({
        username: "admin",
        passwordHash: hashedPassword,
        role: "admin",
        email: "admin@infoseum.local",
      });

      await admin.save();
      console.log(
        "⚠️  Default admin user created. IMPORTANT: Change the admin password immediately!",
      );
    }

    // Create HR user if not exists
    const existingHR = await User.findOne({ role: "hr" });
    if (!existingHR) {
      const hrPassword = "Hr@info123";
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(hrPassword, salt);

      const hr = new User({
        username: "hruser",
        passwordHash: hashedPassword,
        role: "hr",
        email: "hr@infoseum.local",
      });

      await hr.save();
      console.log("✅ HR user (hruser) created successfully");
    }

    // Create IT user if not exists
    const existingIT = await User.findOne({ role: "it" });
    if (!existingIT) {
      const itPassword = "it@2121";
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(itPassword, salt);

      const itUser = new User({
        username: "ituser",
        passwordHash: hashedPassword,
        role: "it",
        email: "it@infoseum.local",
      });

      await itUser.save();
      console.log("✅ IT user (ituser) created successfully");
    }
  } catch (error) {
    console.error("Error creating initial users:", error);
  }
}

export async function connectDB() {
  if (!MONGODB_URI) {
    console.warn(
      "⚠️  MONGODB_URI environment variable is not set. MongoDB features will not be available.",
    );
    return;
  }

  if (isConnected) {
    console.log("Already connected to MongoDB");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      retryWrites: true,
      w: "majority",
    });

    isConnected = true;
    console.log("✅ Connected to MongoDB successfully");

    // Create initial users if they don't exist
    await createInitialAdminIfNeeded();

    return mongoose.connection;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

export async function disconnectDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log("Disconnected from MongoDB");
  }
}

export default mongoose;

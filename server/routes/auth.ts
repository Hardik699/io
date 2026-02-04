import { Router, RequestHandler } from "express";
import { User } from "../models/User";
import bcrypt from "bcryptjs";

const router = Router();

// Login endpoint
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists for security
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Compare passwords
    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Set session
    req.session.userId = user._id.toString();
    req.session.userRole = user.role;
    req.session.username = user.username;

    // Return user data (without password hash)
    return res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Logout endpoint
export const handleLogout: RequestHandler = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to logout",
      });
    }
    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  });
};

// Get current user
export const handleGetCurrentUser: RequestHandler = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    return res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Create initial admin user (only works if no admin exists)
export const createInitialAdmin: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password are required",
      });
    }

    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(403).json({
        success: false,
        error: "Admin user already exists",
      });
    }

    // Create admin user
    const admin = new User({
      username: username.toLowerCase(),
      passwordHash: password,
      role: "admin",
    });

    await admin.save();

    return res.status(201).json({
      success: true,
      message: "Admin user created successfully",
      data: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create admin user",
    });
  }
};

export default router;

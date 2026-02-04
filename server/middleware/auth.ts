import { RequestHandler } from "express";
import type { UserRole } from "@shared/api";

declare global {
  namespace Express {
    interface Session {
      userId?: string;
      userRole?: string;
      username?: string;
    }
  }
}

declare module "express-serve-static-core" {
  interface Request {
    userRole?: UserRole;
    userId?: string;
  }
}

// Middleware to attach user identity from session
export const attachIdentity: RequestHandler = (req, _res, next) => {
  // Get role from session first, then fallback to header for backwards compatibility
  const role = (
    req.session?.userRole ||
    req.header("x-role") ||
    "user"
  ).toLowerCase() as UserRole;
  const userId = req.session?.userId || req.header("x-user-id") || "anonymous";
  req.userRole = role;
  req.userId = userId;
  next();
};

// Check if user is authenticated (has valid session)
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({
      success: false,
      error: "Not authenticated. Please login first.",
    });
  }
  next();
};

// Check if user has admin role
export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({
      success: false,
      error: "Not authenticated",
    });
  }

  if (req.session.userRole !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Admin privileges required",
    });
  }
  next();
};

// Check if user has HR role
export const requireHR: RequestHandler = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({
      success: false,
      error: "Not authenticated",
    });
  }

  if (req.session.userRole !== "hr" && req.session.userRole !== "admin") {
    return res.status(403).json({
      success: false,
      error: "HR privileges required",
    });
  }
  next();
};

// Check if user has IT role
export const requireIT: RequestHandler = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({
      success: false,
      error: "Not authenticated",
    });
  }

  if (req.session.userRole !== "it" && req.session.userRole !== "admin") {
    return res.status(403).json({
      success: false,
      error: "IT privileges required",
    });
  }
  next();
};

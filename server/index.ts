import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import session from "express-session";
import { handleDemo } from "./routes/demo";
import {
  attachIdentity,
  isAuthenticated,
  requireAdmin,
  requireHR,
} from "./middleware/auth";
import { salariesRouter } from "./routes/salaries";
import {
  syncToGoogleSheets,
  getSpreadsheetInfo,
} from "./services/googleSheets";
import { connectDB } from "./db";
import { employeesRouter } from "./routes/employees";
import { departmentsRouter } from "./routes/departments";
import { itAccountsRouter } from "./routes/it-accounts";
import { attendanceRouter } from "./routes/attendance";
import { leaveRequestsRouter } from "./routes/leave-requests";
import { salaryRecordsRouter } from "./routes/salary-records";
import { systemAssetsRouter } from "./routes/system-assets";
import { clearDataRouter } from "./routes/clear-data";
import {
  handleLogin,
  handleLogout,
  handleGetCurrentUser,
  createInitialAdmin,
} from "./routes/auth";

export function createServer() {
  const app = express();

  // Initialize MongoDB connection
  connectDB().catch((error) => {
    console.error("Failed to initialize MongoDB:", error);
    // Continue running even if MongoDB fails to connect
  });

  // Session configuration
  const sessionConfig: session.SessionOptions = {
    secret:
      process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production (HTTPS only)
      httpOnly: true, // Prevent JavaScript access to session cookie
      sameSite: "lax" as const, // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  // Middleware
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:8080",
      credentials: true, // Allow cookies to be sent
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(session(sessionConfig));
  app.use(attachIdentity);

  // Static for uploaded files
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  // Authentication routes (public)
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/logout", handleLogout);
  app.get("/api/auth/me", handleGetCurrentUser);
  app.post("/api/auth/init-admin", createInitialAdmin);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Salaries API
  app.use("/api/salaries", salariesRouter());

  // Google Sheets API
  app.post("/api/google-sheets/sync", syncToGoogleSheets);
  app.get("/api/google-sheets/info", getSpreadsheetInfo);

  // Protected Data APIs (require authentication)
  app.use("/api/employees", isAuthenticated, requireHR, employeesRouter);
  app.use("/api/departments", isAuthenticated, requireHR, departmentsRouter);
  app.use("/api/it-accounts", isAuthenticated, itAccountsRouter);
  app.use("/api/attendance", isAuthenticated, requireHR, attendanceRouter);
  app.use(
    "/api/leave-requests",
    isAuthenticated,
    requireHR,
    leaveRequestsRouter,
  );
  app.use(
    "/api/salary-records",
    isAuthenticated,
    requireHR,
    salaryRecordsRouter,
  );
  app.use("/api/system-assets", isAuthenticated, systemAssetsRouter);

  // Clear data API (for development/testing - admin only)
  app.use("/api/clear-data", isAuthenticated, requireAdmin, clearDataRouter);

  return app;
}

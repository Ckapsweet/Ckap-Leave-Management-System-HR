// app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import leaveTypeRoutes from "./routes/leaveTypes.js";
import leaveRequestRoutes from "./routes/leaveRequests.js";
import leaveBalanceRoutes from "./routes/leaveBalances.js";
import adminRoutes from "./routes/admin.js";
import superAdminRoutes from "./routes/superAdmin.js";
import otRequestRoutes from "./routes/otRequests.js";
import otTypeRoutes from "./routes/otTypes.js";
import otBalanceRoutes from "./routes/otBalances.js";

dotenv.config();

const app = express();

const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5174"];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/leave-types", leaveTypeRoutes);
app.use("/api/leave-requests", leaveRequestRoutes);
app.use("/api/leave-balances", leaveBalanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/ot-requests", otRequestRoutes);
app.use("/api/ot-types", otTypeRoutes);
app.use("/api/ot-balances", otBalanceRoutes);

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("─────────────────────────────────────────");
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`);
  console.error(`Status : ${err.status || 500}`);
  console.error(`Message: ${err.message}`);
  if (err.sql) console.error(`SQL    : ${err.sql}`);
  if (err.sqlMessage) console.error(`SQLMsg : ${err.sqlMessage}`);
  console.error(`Stack  :`, err.stack?.split("\n").slice(0, 4).join("\n"));
  console.error("─────────────────────────────────────────");

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

export default app;
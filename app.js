// app.js
import express      from "express";
import cors         from "cors";
import cookieParser from "cookie-parser";
import dotenv       from "dotenv";

import authRoutes         from "./routes/auth.js";
import leaveTypeRoutes    from "./routes/leaveTypes.js";
import leaveRequestRoutes from "./routes/leaveRequests.js";
import leaveBalanceRoutes from "./routes/leaveBalances.js";
import adminRoutes        from "./routes/admin.js";

dotenv.config();

const app = express();

// credentials: true — จำเป็นสำหรับ httpOnly cookie ข้าม origin
app.use(cors({
  origin:      process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser()); // อ่าน cookie จาก request

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth",           authRoutes);
app.use("/api/leave-types",    leaveTypeRoutes);
app.use("/api/leave-requests", leaveRequestRoutes);
app.use("/api/leave-balances", leaveBalanceRoutes);
app.use("/api/admin",          adminRoutes);

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

export default app;
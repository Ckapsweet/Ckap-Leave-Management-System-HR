import express from "express";
import cors from "cors";

import authRoutes from "./modules/auth/auth.route.js";
import leaveRoutes from "./modules/leave/leave.route.js";
import userRoutes from "./modules/user/user.route.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/user", userRoutes);

export default app;
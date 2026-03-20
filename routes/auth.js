// routes/auth.js
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { employee_code, password } = req.body;
    if (!employee_code || !password) {
      return res.status(400).json({ message: "กรุณากรอก employee_code และ password" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE employee_code = ? LIMIT 1",
      [employee_code]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: "ไม่พบผู้ใช้งาน" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign(
      { id: user.id, employee_code: user.employee_code, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    res.json({
      token,
      user: {
        id:            user.id,
        employee_code: user.employee_code,
        full_name:     user.full_name,
        department:    user.department,
        role:          user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, employee_code, full_name, department, role FROM users WHERE id = ? LIMIT 1",
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
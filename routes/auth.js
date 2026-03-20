// routes/auth.js
import { Router } from "express";
import bcrypt      from "bcrypt";
import jwt         from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import pool        from "../config/db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const IS_PROD = process.env.NODE_ENV === "production";

// ── helpers — ตั้งค่า cookie ─────────────────────────────────
function setAuthCookies(res, jwtToken, csrfToken) {
  // JWT — httpOnly: JS อ่านไม่ได้
  res.cookie("token", jwtToken, {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: IS_PROD ? "strict" : "lax",
    maxAge:   8 * 60 * 60 * 1000, // 8 ชั่วโมง
  });

  // CSRF token — JS อ่านได้ (ตั้งใจ) เพื่อให้ frontend อ่านแล้วใส่ใน header
  res.cookie("csrf_token", csrfToken, {
    httpOnly: false,
    secure:   IS_PROD,
    sameSite: IS_PROD ? "strict" : "lax",
    maxAge:   8 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res) {
  res.clearCookie("token",      { httpOnly: true,  secure: IS_PROD, sameSite: IS_PROD ? "strict" : "lax" });
  res.clearCookie("csrf_token", { httpOnly: false, secure: IS_PROD, sameSite: IS_PROD ? "strict" : "lax" });
}

// ── POST /api/auth/login ──────────────────────────────────────
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
    if (!user) return res.status(401).json({ message: "ไม่พบผู้ใช้งาน" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });

    const csrfToken = uuidv4();

    const jwtToken = jwt.sign(
      { id: user.id, employee_code: user.employee_code, role: user.role, csrf: csrfToken },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    setAuthCookies(res, jwtToken, csrfToken);

    // ไม่ส่ง token กลับใน body — ส่งแค่ข้อมูล user
    res.json({
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

// ── POST /api/auth/logout ─────────────────────────────────────
router.post("/logout", (req, res) => {
  clearAuthCookies(res);
  res.json({ message: "Logged out" });
});

// ── GET /api/auth/me ──────────────────────────────────────────
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
// routes/auth.js
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.js";
import { authenticate, csrfProtect } from "../middleware/auth.js";

const router = Router();

const IS_PROD = process.env.NODE_ENV === "production";

function toPublicUser(user) {
  return {
    id: user.id,
    employee_code: user.employee_code,
    full_name: user.full_name,
    english_name: user.english_name ?? null,
    department: user.department,
    role: user.role,
    supervisor_id: user.supervisor_id ?? null,
    email: user.email ?? null,
    email_2: user.email_2 ?? null,
    phone: user.phone ?? null,
  };
}

function cleanOptional(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function isValidEmail(value) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// ── helpers — ตั้งค่า cookie ─────────────────────────────────
function setAuthCookies(res, jwtToken, csrfToken) {
  // JWT — httpOnly: JS อ่านไม่ได้
  res.cookie("token", jwtToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "strict" : "lax",
    maxAge: 8 * 60 * 60 * 1000, // 8 ชั่วโมง
  });

  // CSRF token — JS อ่านได้ (ตั้งใจ) เพื่อให้ frontend อ่านแล้วใส่ใน header
  res.cookie("csrf_token", csrfToken, {
    httpOnly: false,
    secure: IS_PROD,
    sameSite: IS_PROD ? "strict" : "lax",
    maxAge: 8 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res) {
  res.clearCookie("token", { httpOnly: true, secure: IS_PROD, sameSite: IS_PROD ? "strict" : "lax" });
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
      "SELECT * FROM users WHERE employee_code = ? AND is_active = 1 LIMIT 1",
      [employee_code]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "ไม่พบผู้ใช้งาน" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });

    const csrfToken = uuidv4();

    const jwtToken = jwt.sign(
      { id: user.id, employee_code: user.employee_code, role: user.role, department: user.department, csrf: csrfToken },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    setAuthCookies(res, jwtToken, csrfToken);

    // ไม่ส่ง token กลับใน body — ส่งแค่ข้อมูล user
    res.json({ user: toPublicUser(user) });
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
      "SELECT id, employee_code, full_name, english_name, department, role, supervisor_id, email, email_2, phone FROM users WHERE id = ? AND is_active = 1 LIMIT 1",
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/auth/profile ─────────────────────────────────────
router.put("/profile", authenticate, csrfProtect, async (req, res, next) => {
  try {
    const fullName = typeof req.body.full_name === "string" ? req.body.full_name.trim() : "";
    const shouldUpdateEnglishName = Object.prototype.hasOwnProperty.call(req.body, "english_name");
    const englishName = shouldUpdateEnglishName ? cleanOptional(req.body.english_name) : undefined;
    const email = cleanOptional(req.body.email);
    const email2 = cleanOptional(req.body.email_2);
    const phone = cleanOptional(req.body.phone);

    if (!fullName) return res.status(400).json({ message: "กรุณาระบุชื่อ-นามสกุล" });
    if (!isValidEmail(email) || !isValidEmail(email2)) {
      return res.status(400).json({ message: "รูปแบบอีเมลไม่ถูกต้อง" });
    }

    if (shouldUpdateEnglishName) {
      await pool.query(
        "UPDATE users SET full_name = ?, english_name = ?, email = ?, email_2 = ?, phone = ? WHERE id = ?",
        [fullName, englishName, email, email2, phone, req.user.id]
      );
    } else {
      await pool.query(
        "UPDATE users SET full_name = ?, email = ?, email_2 = ?, phone = ? WHERE id = ?",
        [fullName, email, email2, phone, req.user.id]
      );
    }

    const [rows] = await pool.query(
      "SELECT id, employee_code, full_name, english_name, department, role, supervisor_id, email, email_2, phone FROM users WHERE id = ? AND is_active = 1 LIMIT 1",
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });

    res.json(toPublicUser(rows[0]));
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/change-password ────────────────────────────
router.post("/change-password", authenticate, async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return res.status(400).json({ message: "กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE id = ? AND is_active = 1 LIMIT 1",
      [req.user.id]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });

    const match = await bcrypt.compare(old_password, user.password);
    if (!match) return res.status(400).json({ message: "รหัสผ่านเดิมไม่ถูกต้อง" });

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, req.user.id]
    );

    res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    next(err);
  }
});

export default router;

// middleware/auth.js
import jwt from "jsonwebtoken";

// ── อ่าน JWT จาก httpOnly cookie ─────────────────────────────
export function authenticate(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Token invalid or expired" });
  }
}

// ── เช็ค role assistant manager หรือสูงกว่า (manager) ──────────────────────
// manager = approve/reject leave, จัดการ user ด้วย (แทนที่ hr/super_admin)
export function requireAdmin(req, res, next) {
  const allowedRoles = ["manager", "assistant manager", "lead"];
  if (!allowedRoles.includes(req.user?.role)) {
    return res.status(403).json({ message: "Forbidden: manager/assistant manager/lead access only" });
  }
  next();
}

// ── CSRF protection ───────────────────────────────────────────
// ตรวจสอบ X-CSRF-Token header ให้ตรงกับ csrf_token cookie
// ใช้กับทุก route ที่เปลี่ยนแปลงข้อมูล (POST, PATCH, DELETE)
export function csrfProtect(req, res, next) {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) return next();

  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.headers["x-csrf-token"];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: "CSRF token invalid" });
  }
  next();
}
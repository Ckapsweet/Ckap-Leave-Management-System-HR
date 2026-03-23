// middleware/audit.js
import pool from "../config/db.js";

/**
 * logAudit — บันทึก audit log ลง audit_logs table
 *
 * @param {object} opts
 * @param {object}  opts.req         - Express request (ดึง actor + ip)
 * @param {string}  opts.action      - 'leave.approve' | 'leave.reject' | ...
 * @param {string}  opts.targetType  - 'leave_request' | 'leave_balance' | 'user'
 * @param {number}  opts.targetId    - PK ของ record ที่ถูกกระทำ
 * @param {object}  [opts.before]    - snapshot ก่อนเปลี่ยน (optional)
 * @param {object}  [opts.after]     - snapshot หลังเปลี่ยน (optional)
 * @param {string}  [opts.note]      - หมายเหตุ เช่น comment จาก admin
 * @param {object}  [opts.conn]      - DB connection (ถ้าอยู่ใน transaction เดียวกัน)
 */
export async function logAudit({ req, action, targetType, targetId, before = null, after = null, note = null, conn = null }) {
  try {
    const db = conn ?? pool;
    const actor = req.user;

    await db.query(
      `INSERT INTO audit_logs
         (actor_id, actor_role, action, target_type, target_id, before_data, after_data, note, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        actor.id,
        actor.role,
        action,
        targetType ?? null,
        targetId   ?? null,
        before     ? JSON.stringify(before) : null,
        after      ? JSON.stringify(after)  : null,
        note       ?? null,
        req.ip     ?? req.headers["x-forwarded-for"] ?? null,
        req.headers["user-agent"]?.slice(0, 255) ?? null,
      ]
    );
  } catch (err) {
    // audit log ไม่ควรทำให้ request หลัก fail
    console.error("[audit] failed to write log:", err.message);
  }
}

/**
 * requireRole — middleware ตรวจ role
 * ใช้แทน if (req.user.role !== 'admin') return 403
 *
 * @param  {...string} roles - roles ที่อนุญาต เช่น requireRole('admin', 'super_admin')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึง" });
    }
    next();
  };
}
// routes/superAdmin.js
import { Router } from "express";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import { authenticate, csrfProtect } from "../middleware/auth.js";
import { requireRole, logAudit } from "../middleware/audit.js";

const router = Router();

// ทุก route ใน superAdmin ต้อง authenticate + เป็น super_admin เท่านั้น
router.use(authenticate, requireRole("hr"));

// ─────────────────────────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/hr/audit-logs
 * query: action, actor_id, target_type, date_from, date_to, page, limit
 */
router.get("/audit-logs", async (req, res, next) => {
  try {
    const {
      action,
      actor_id,
      target_type,
      date_from,
      date_to,
      page = 1,
      limit = 50,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    const where = ["1=1"];

    if (action) { where.push("al.action      = ?"); params.push(action); }
    if (actor_id) { where.push("al.actor_id    = ?"); params.push(Number(actor_id)); }
    if (target_type) { where.push("al.target_type = ?"); params.push(target_type); }
    if (date_from) { where.push("al.created_at >= ?"); params.push(date_from); }
    if (date_to) { where.push("al.created_at <= ?"); params.push(date_to + " 23:59:59"); }

    // total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM audit_logs al WHERE ${where.join(" AND ")}`,
      params
    );
    const total = countRows[0].total;

    // data with actor info
    const [rows] = await pool.query(
      `SELECT
         al.id, al.created_at, al.action,
         al.target_type, al.target_id,
         al.before_data, al.after_data,
         al.note, al.ip_address,
         al.actor_id, al.actor_role,
         u.full_name     AS actor_name,
         u.employee_code AS actor_code,
         u.department    AS actor_dept
       FROM audit_logs al
       INNER JOIN users u ON u.id = al.actor_id
       WHERE ${where.join(" AND ")}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    // parse JSON fields
    const data = rows.map((r) => ({
      ...r,
      before_data: r.before_data ? JSON.parse(r.before_data) : null,
      after_data: r.after_data ? JSON.parse(r.after_data) : null,
    }));

    res.json({
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/hr/audit-logs/actions
 * คืน list ของ action ที่มีใน DB (สำหรับ filter dropdown)
 */
router.get("/audit-logs/actions", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT DISTINCT action FROM audit_logs ORDER BY action ASC"
    );
    res.json(rows.map((r) => r.action));
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/hr/users
 * ดูรายชื่อ user ทุกคน รวม admin
 */
router.get("/users", async (req, res, next) => {
  try {
    const { role, department, search } = req.query;
    const where = ["1=1"];
    const params = [];

    if (role) { where.push("role       = ?"); params.push(role); }
    if (department) { where.push("department = ?"); params.push(department); }
    if (search) {
      where.push("(full_name LIKE ? OR employee_code LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.query(
      `SELECT id, employee_code, full_name, department, role, supervisor_id, created_at
       FROM users
       WHERE ${where.join(" AND ")}
       ORDER BY created_at ASC`,
      params
    );
    res.json(rows);
  } catch (err) { next(err); }
});

/**
 * POST /api/hr/users
 * สร้าง user / admin ใหม่
 */
router.post("/users", csrfProtect, async (req, res, next) => {
  try {
    const { employee_code, full_name, department, password, role = "user" } = req.body;

    if (!employee_code || !full_name || !password) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }
    const allowedRoles = ["user", "lead", "hr", "manager"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "role ไม่ถูกต้อง" });
    }

    const [exist] = await pool.query(
      "SELECT id FROM users WHERE employee_code = ? LIMIT 1", [employee_code]
    );
    if (exist[0]) return res.status(409).json({ message: "employee_code ซ้ำ" });

    const hashed = await bcrypt.hash(password, 10);
    const { supervisor_id = null } = req.body;
    const [result] = await pool.query(
      `INSERT INTO users (employee_code, full_name, department, password, role, supervisor_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employee_code, full_name, department ?? null, hashed, role, supervisor_id]
    );

    const newUser = { id: result.insertId, employee_code, full_name, department, role, supervisor_id };

    await logAudit({
      req,
      action: "user.create",
      targetType: "user",
      targetId: result.insertId,
      after: newUser,
      note: `สร้าง user ${employee_code} (${role})`,
    });

    res.status(201).json(newUser);
  } catch (err) { next(err); }
});

/**
 * PATCH /api/hr/users/:id/role
 * เปลี่ยน role (sensitive — log เสมอ)
 */
router.patch("/users/:id/role", csrfProtect, async (req, res, next) => {
  try {
    const { role } = req.body;
    const allowedRoles = ["user", "lead", "hr", "manager"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "role ไม่ถูกต้อง" });
    }

    const [rows] = await pool.query(
      "SELECT id, employee_code, full_name, role FROM users WHERE id = ? LIMIT 1",
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });

    // ห้ามเปลี่ยน role ของตัวเอง
    if (rows[0].id === req.user.id) {
      return res.status(400).json({ message: "ไม่สามารถเปลี่ยน role ของตัวเองได้" });
    }

    const before = { role: rows[0].role };
    await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id]);

    await logAudit({
      req,
      action: "user.role_change",
      targetType: "user",
      targetId: rows[0].id,
      before,
      after: { role },
      note: `${rows[0].employee_code} เปลี่ยน role: ${before.role} → ${role}`,
    });

    res.json({ message: "เปลี่ยน role เรียบร้อย", role });
  } catch (err) { next(err); }
});

/**
 * PATCH /api/hr/users/:id/supervisor
 * เปลี่ยนหัวหน้า (supervisor_id)
 */
router.patch("/users/:id/supervisor", csrfProtect, async (req, res, next) => {
  try {
    const { supervisor_id } = req.body;
    
    const [userRows] = await pool.query(
      "SELECT id, employee_code, full_name, supervisor_id FROM users WHERE id = ? LIMIT 1",
      [req.params.id]
    );
    if (!userRows[0]) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });

    // ห้ามตั้งตัวเองเป็นหัวหน้าตัวเอง
    if (supervisor_id && Number(supervisor_id) === Number(req.params.id)) {
      return res.status(400).json({ message: "ไม่สามารถตั้งตัวเองเป็นหัวหน้าได้" });
    }

    const before = { supervisor_id: userRows[0].supervisor_id };
    await pool.query("UPDATE users SET supervisor_id = ? WHERE id = ?", [supervisor_id || null, req.params.id]);

    await logAudit({
      req,
      action: "user.update",
      targetType: "user",
      targetId: userRows[0].id,
      before,
      after: { supervisor_id },
      note: `${userRows[0].employee_code} เปลี่ยนหัวหน้า: ${before.supervisor_id} → ${supervisor_id}`,
    });

    res.json({ message: "เปลี่ยนหัวหน้าเรียบร้อย", supervisor_id });
  } catch (err) { next(err); }
});

/**
 * DELETE /api/hr/users/:id
 * ลบ user (ไม่สามารถลบตัวเองได้)
 */
router.delete("/users/:id", csrfProtect, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, employee_code, full_name, role FROM users WHERE id = ? LIMIT 1",
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    if (rows[0].id === req.user.id) {
      return res.status(400).json({ message: "ไม่สามารถลบตัวเองได้" });
    }

    await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);

    await logAudit({
      req,
      action: "user.delete",
      targetType: "user",
      targetId: rows[0].id,
      before: { employee_code: rows[0].employee_code, full_name: rows[0].full_name, role: rows[0].role },
      note: `ลบ user ${rows[0].employee_code}`,
    });

    res.json({ message: "ลบผู้ใช้งานเรียบร้อย" });
  } catch (err) { next(err); }
});

export default router;
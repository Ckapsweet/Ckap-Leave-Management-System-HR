// routes/superAdmin.js
import { Router } from "express";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import { authenticate, csrfProtect } from "../middleware/auth.js";
import { requireRole, logAudit } from "../middleware/audit.js";

const router = Router();

router.use(authenticate, requireRole("manager", "assistant manager", "admin"));

router.get("/audit-logs", async (req, res, next) => {
  try {
    const { action, actor_id, target_type, date_from, date_to, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    const where = ["1=1"];

    if (action) { where.push("al.action = ?"); params.push(action); }
    if (actor_id) { where.push("al.actor_id = ?"); params.push(Number(actor_id)); }
    if (target_type) { where.push("al.target_type = ?"); params.push(target_type); }
    if (date_from) { where.push("al.created_at >= ?"); params.push(date_from); }
    if (date_to) { where.push("al.created_at <= ?"); params.push(date_to + " 23:59:59"); }

    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM audit_logs al WHERE ${where.join(" AND ")}`, params);
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT al.*, u.full_name AS actor_name, u.employee_code AS actor_code, u.department AS actor_dept
       FROM audit_logs al INNER JOIN users u ON u.id = al.actor_id
       WHERE ${where.join(" AND ")} ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const data = rows.map((r) => ({
      ...r,
      before_data: r.before_data ? JSON.parse(r.before_data) : null,
      after_data: r.after_data ? JSON.parse(r.after_data) : null,
    }));

    res.json({ data, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
});

router.get("/audit-logs/actions", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT DISTINCT action FROM audit_logs ORDER BY action ASC");
    res.json(rows.map((r) => r.action));
  } catch (err) { next(err); }
});

router.get("/users", async (req, res, next) => {
  try {
    const { role, department, search } = req.query;
    const where = ["1=1"];
    const params = [];

    if (role) { where.push("role = ?"); params.push(role); }
    if (department) { where.push("department = ?"); params.push(department); }
    if (search) {
      where.push("(full_name LIKE ? OR employee_code LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.query(
      `SELECT id, employee_code, full_name, department, role, supervisor_id, created_at
       FROM users WHERE ${where.join(" AND ")} ORDER BY created_at ASC`,
      params
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post("/users", csrfProtect, async (req, res, next) => {
  try {
    const { employee_code, full_name, department, password, role = "user", supervisor_id = null } = req.body;

    if (!employee_code || !full_name || !password) return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });

    // เพิ่ม admin เข้าไปใน Role ที่อนุญาตให้สร้างได้
    const allowedRoles = ["user", "lead", "assistant manager", "manager", "admin"];
    if (!allowedRoles.includes(role)) return res.status(400).json({ message: "role ไม่ถูกต้อง" });

    const [exist] = await pool.query("SELECT id FROM users WHERE employee_code = ? LIMIT 1", [employee_code]);
    if (exist[0]) return res.status(409).json({ message: "employee_code ซ้ำ" });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (employee_code, full_name, department, password, role, supervisor_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [employee_code, full_name, department ?? null, hashed, role, supervisor_id]
    );

    const newUser = { id: result.insertId, employee_code, full_name, department, role, supervisor_id };

    await logAudit({ req, action: "user.create", targetType: "user", targetId: result.insertId, after: newUser, note: `สร้าง user ${employee_code}` });
    res.status(201).json(newUser);
  } catch (err) { next(err); }
});

router.patch("/users/:id/role", csrfProtect, async (req, res, next) => {
  try {
    const { role } = req.body;
    // เพิ่ม admin ใน Role ที่สามารถกำหนดให้กันได้
    const allowedRoles = ["user", "lead", "assistant manager", "manager", "admin"];
    if (!allowedRoles.includes(role)) return res.status(400).json({ message: "role ไม่ถูกต้อง" });

    const [rows] = await pool.query("SELECT id, employee_code, full_name, role FROM users WHERE id = ? LIMIT 1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    if (rows[0].id === req.user.id) return res.status(400).json({ message: "ไม่สามารถเปลี่ยน role ของตัวเองได้" });

    if (req.user.role === "assistant manager") {
      if (["manager", "assistant manager", "admin", "hr"].includes(rows[0].role)) {
        return res.status(403).json({ message: "คุณไม่มีสิทธิ์แก้ไข role ของผู้มีสิทธิ์ระดับบริหารหรือ admin" });
      }
      if (!["lead", "user"].includes(role)) {
        return res.status(403).json({ message: "Assistant Manager กำหนดได้เฉพาะ lead และ user" });
      }
    }

    const before = { role: rows[0].role };
    await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id]);
    await logAudit({ req, action: "user.role_change", targetType: "user", targetId: rows[0].id, before, after: { role }, note: `เปลี่ยน role ${before.role} → ${role}` });

    res.json({ message: "เปลี่ยน role เรียบร้อย", role });
  } catch (err) { next(err); }
});

router.patch("/users/:id/supervisor", csrfProtect, async (req, res, next) => {
  try {
    const { supervisor_id } = req.body;
    const [userRows] = await pool.query("SELECT id, employee_code, supervisor_id FROM users WHERE id = ? LIMIT 1", [req.params.id]);

    if (!userRows[0]) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    if (supervisor_id && Number(supervisor_id) === Number(req.params.id)) return res.status(400).json({ message: "ตั้งตัวเองเป็นหัวหน้าไม่ได้" });

    const before = { supervisor_id: userRows[0].supervisor_id };
    await pool.query("UPDATE users SET supervisor_id = ? WHERE id = ?", [supervisor_id || null, req.params.id]);
    await logAudit({ req, action: "user.update", targetType: "user", targetId: userRows[0].id, before, after: { supervisor_id }, note: `เปลี่ยนหัวหน้าเป็น ID ${supervisor_id}` });

    res.json({ message: "เปลี่ยนหัวหน้าเรียบร้อย", supervisor_id });
  } catch (err) { next(err); }
});

router.delete("/users/:id", csrfProtect, async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT id, employee_code, full_name, role FROM users WHERE id = ? LIMIT 1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    if (rows[0].id === req.user.id) return res.status(400).json({ message: "ไม่สามารถลบตัวเองได้" });

    await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    await logAudit({ req, action: "user.delete", targetType: "user", targetId: rows[0].id, before: rows[0], note: `ลบ user ${rows[0].employee_code}` });

    res.json({ message: "ลบผู้ใช้งานเรียบร้อย" });
  } catch (err) { next(err); }
});

export default router;
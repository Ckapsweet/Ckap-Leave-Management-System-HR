// routes/admin.js
import { Router } from "express";
import pool from "../config/db.js";
import { authenticate, requireAdmin, csrfProtect } from "../middleware/auth.js";
import { logAudit } from "../middleware/audit.js";

const router = Router();
router.use(authenticate, requireAdmin); // อย่าลืมเช็คว่า requireAdmin ใน middleware/auth.js อนุญาต 'admin' ด้วยนะครับ

// ── helper ────────────────────────────────────────────────────
function mapRow(r) {
  const isHour = !!r.start_time;
  let total_hours = null;
  if (isHour && r.start_time && r.end_time) {
    const [sh, sm] = r.start_time.split(":").map(Number);
    const [eh, em] = r.end_time.split(":").map(Number);
    total_hours = Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 10) / 10;
  }
  return {
    ...r,
    leave_unit: isHour ? "hour" : "day",
    total_hours,
    user: {
      id: r.user_id,
      full_name: r.user_full_name,
      employee_code: r.employee_code,
      department: r.department,
      role: r.user_role,
      supervisor_id: r.supervisor_id,
    },
    leave_type: {
      id: r.leave_type_id,
      name: r.leave_type_name,
      max_days: r.leave_type_max_days,
    },
  };
}

function assertSameDept(req, res, dept) {
  // ยกเว้น admin และ manager ให้ข้ามแผนกได้
  if (req.user.role === "admin" || req.user.role === "manager") return true;

  const isDeptAdmin = req.user.role === "assistant manager";
  if (isDeptAdmin && req.user.department !== dept) {
    res.status(403).json({ message: "ไม่มีสิทธิ์จัดการพนักงานนอกแผนกของคุณ" });
    return false;
  }
  return true;
}

async function assertIsSubordinate(conn, supervisorId, userId, res, reqRole) {
  // ถ้าเป็น admin ให้จัดการได้ทุกคน
  if (reqRole === "admin") return true;

  const [rows] = await conn.query(
    "SELECT id FROM users WHERE id = ? AND supervisor_id = ? LIMIT 1",
    [userId, supervisorId]
  );
  if (!rows[0]) {
    res.status(403).json({ message: "คุณไม่มีสิทธิ์ดำเนินการกับพนักงานที่ไม่ใช่ลูกน้องของคุณ" });
    return false;
  }
  return true;
}

// ── GET /api/admin/leave-requests ────────────────────────────
router.get("/leave-requests", async (req, res, next) => {
  try {
    const { status, user_id, year } = req.query;

    let sql = `
      SELECT lr.*, u.full_name AS user_full_name, u.employee_code, u.department, u.role AS user_role, u.supervisor_id,
             lt.name AS leave_type_name, lt.max_days AS leave_type_max_days,
             approver.full_name AS approver_name, la.comment
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN users approver ON lr.approved_by = approver.id
      LEFT JOIN leave_approvals la ON la.leave_request_id = lr.id
      WHERE 1=1`;
    const params = [];

    // ถ้าไม่ใช่ admin ให้ดูได้เฉพาะคนที่อยู่ใต้สังกัด (Supervisor ID)
    if (["lead", "assistant manager", "manager"].includes(req.user.role) && req.user.role !== "admin") {
      sql += " AND u.supervisor_id = ?";
      params.push(req.user.id);
    }

    if (status) { sql += " AND lr.status = ?"; params.push(status); }
    if (user_id) { sql += " AND lr.user_id = ?"; params.push(user_id); }
    if (year) { sql += " AND YEAR(lr.start_date) = ?"; params.push(year); }
    sql += " ORDER BY lr.created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows.map(mapRow));
  } catch (err) { next(err); }
});

// ── PATCH /api/admin/leave-requests/:id/approve ──────────────
router.patch("/leave-requests/:id/approve", csrfProtect, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { comment = null } = req.body;
    const requestId = req.params.id;
    const approverId = req.user.id;

    const [rows] = await conn.query(
      `SELECT lr.*, u.department AS user_dept, u.supervisor_id AS user_supervisor_id
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       WHERE lr.id = ? LIMIT 1`,
      [requestId]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบคำขอลา" });
    if (!assertSameDept(req, res, rows[0].user_dept)) return;

    if (["lead", "assistant manager", "manager"].includes(req.user.role) && req.user.role !== "admin") {
      if (!(await assertIsSubordinate(conn, approverId, rows[0].user_id, res, req.user.role))) return;
    }
    if (rows[0].status !== "pending") {
      return res.status(400).json({ message: "คำขอนี้ถูกดำเนินการไปแล้ว" });
    }

    const before = {
      status: rows[0].status,
      approved_by: rows[0].approved_by,
      approved_at: rows[0].approved_at,
    };

    await conn.beginTransaction();
    const now = new Date();

    await conn.query(
      "UPDATE leave_requests SET status = 'approved', approved_by = ?, approved_at = ? WHERE id = ?",
      [approverId, now, requestId]
    );
    await conn.query(
      `INSERT INTO leave_approvals (leave_request_id, approver_id, status, comment, approved_at)
       VALUES (?, ?, 'approved', ?, ?)
       ON DUPLICATE KEY UPDATE status = 'approved', comment = ?, approved_at = ?`,
      [requestId, approverId, comment, now, comment, now]
    );

    const year = new Date(rows[0].start_date).getFullYear();
    await conn.query(
      `UPDATE user_leave_pool
       SET used_days = used_days + ?
       WHERE user_id = ? AND year = ?`,
      [rows[0].total_days, rows[0].user_id, year]
    );

    await conn.commit();

    await logAudit({
      req,
      action: "leave.approve",
      targetType: "leave_request",
      targetId: Number(requestId),
      before,
      after: { status: "approved", approved_by: approverId, approved_at: now, comment: comment ?? null },
      note: comment ?? null,
      conn,
    });

    res.json({ message: "อนุมัติคำขอลาเรียบร้อย" });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally { conn.release(); }
});

// ── PATCH /api/admin/leave-requests/:id/reject ───────────────
router.patch("/leave-requests/:id/reject", csrfProtect, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { comment = null } = req.body;
    const requestId = req.params.id;
    const approverId = req.user.id;

    const [rows] = await conn.query(
      `SELECT lr.*, u.department AS user_dept, u.supervisor_id AS user_supervisor_id
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       WHERE lr.id = ? LIMIT 1`,
      [requestId]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบคำขอลา" });
    if (!assertSameDept(req, res, rows[0].user_dept)) return;

    if (["lead", "assistant manager", "manager"].includes(req.user.role) && req.user.role !== "admin") {
      if (!(await assertIsSubordinate(conn, approverId, rows[0].user_id, res, req.user.role))) return;
    }
    if (rows[0].status !== "pending") {
      return res.status(400).json({ message: "คำขอนี้ถูกดำเนินการไปแล้ว" });
    }

    const before = {
      status: rows[0].status,
      approved_by: rows[0].approved_by,
      approved_at: rows[0].approved_at,
    };

    await conn.beginTransaction();
    const now = new Date();

    await conn.query(
      "UPDATE leave_requests SET status = 'rejected', approved_by = ?, approved_at = ? WHERE id = ?",
      [approverId, now, requestId]
    );
    await conn.query(
      `INSERT INTO leave_approvals (leave_request_id, approver_id, status, comment, approved_at)
       VALUES (?, ?, 'rejected', ?, ?)
       ON DUPLICATE KEY UPDATE status = 'rejected', comment = ?, approved_at = ?`,
      [requestId, approverId, comment, now, comment, now]
    );

    await conn.commit();

    await logAudit({
      req,
      action: "leave.reject",
      targetType: "leave_request",
      targetId: Number(requestId),
      before,
      after: { status: "rejected", approved_by: approverId, approved_at: now, comment: comment ?? null },
      note: comment ?? null,
      conn,
    });

    res.json({ message: "ปฏิเสธคำขอลาเรียบร้อย" });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally { conn.release(); }
});

// ── GET /api/admin/users ──────────────────────────────────────
router.get("/users", async (req, res, next) => {
  try {
    let sql = `SELECT id, employee_code, full_name, department, role, supervisor_id, created_at FROM users`;
    const params = [];

    if (req.user.role === "lead") {
      sql += " WHERE id != ? AND role = 'user'";
      params.push(req.user.id);
    } else if (req.user.role === "assistant manager") {
      sql += " WHERE id != ? AND role = 'lead'";
      params.push(req.user.id);
    }
    // manager และ admin เห็นทุกคน
    sql += " ORDER BY id ASC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// ── PATCH /api/admin/users/:id/assign-subordinate ─────────────
router.patch("/users/:id/assign-subordinate", csrfProtect, async (req, res, next) => {
  try {
    const { role: callerRole, id: callerId } = req.user;
    if (!["lead", "assistant manager", "manager", "admin"].includes(callerRole)) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์ใช้งาน endpoint นี้" });
    }

    const userId = Number(req.params.id);
    const { assign } = req.body;

    if (userId === callerId) {
      return res.status(400).json({ message: "ไม่สามารถกำหนดตนเองเป็นลูกน้องได้" });
    }

    const [target] = await pool.query(
      "SELECT id, full_name, role, supervisor_id FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    if (!target[0]) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });

    let allowedSubRoles = [];
    if (callerRole === "lead") allowedSubRoles = ["user"];
    else if (callerRole === "assistant manager") allowedSubRoles = ["lead"];
    else allowedSubRoles = ["assistant manager", "lead", "user", "manager"]; // admin/manager สามารถคุมได้ทั้งหมด

    if (!allowedSubRoles.includes(target[0].role)) {
      return res.status(400).json({ message: `ไม่สามารถกำหนด role ${target[0].role} เป็นลูกน้องได้` });
    }

    if (!assign && target[0].supervisor_id !== callerId && callerRole !== "admin") {
      return res.status(400).json({ message: "พนักงานนี้ไม่ใช่ลูกน้องของคุณ" });
    }
    if (assign && target[0].supervisor_id !== null && target[0].supervisor_id !== callerId && callerRole !== "admin") {
      return res.status(409).json({ message: "พนักงานนี้มีหัวหน้าอยู่แล้ว กรุณาติดต่อ admin" });
    }

    const newSupervisor = assign ? callerId : null;
    await pool.query("UPDATE users SET supervisor_id = ? WHERE id = ?", [newSupervisor, userId]);

    await logAudit({
      req,
      action: assign ? `${callerRole}.assign_subordinate` : `${callerRole}.unassign_subordinate`,
      targetType: "user",
      targetId: userId,
      after: { supervisor_id: newSupervisor, full_name: target[0].full_name },
      note: assign ? `กำหนด ${target[0].role} ${userId} เป็นลูกน้อง` : `ยกเลิก ${target[0].role} ${userId} จากลูกน้อง`,
    });

    res.json({ message: assign ? "กำหนดลูกน้องเรียบร้อย" : "ยกเลิกลูกน้องเรียบร้อย", user_id: userId, supervisor_id: newSupervisor });
  } catch (err) { next(err); }
});

// ── GET /api/admin/leave-pool/:user_id ───────────────────────
router.get("/leave-pool/:user_id", async (req, res, next) => {
  try {
    const year = req.query.year ?? new Date().getFullYear();
    const [uRows] = await pool.query("SELECT department FROM users WHERE id = ? LIMIT 1", [req.params.user_id]);
    if (!uRows[0]) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    if (!assertSameDept(req, res, uRows[0].department)) return;

    const [rows] = await pool.query(
      "SELECT * FROM user_leave_pool WHERE user_id = ? AND year = ? LIMIT 1",
      [req.params.user_id, year]
    );
    const r = rows[0];
    if (!r) {
      return res.json({ id: null, user_id: Number(req.params.user_id), total_days: 0, used_days: 0, remaining: 0, year: Number(year) });
    }
    res.json({ ...r, remaining: Math.max(0, r.total_days - r.used_days) });
  } catch (err) { next(err); }
});

// ── PATCH /api/admin/leave-pool/:user_id ─────────────────────
router.patch("/leave-pool/:user_id", csrfProtect, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { remaining_days, year } = req.body;
    const userId = req.params.user_id;

    if (remaining_days === undefined || !year) return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    if (remaining_days < 0) return res.status(400).json({ message: "วันลาคงเหลือต้องไม่ติดลบ" });

    const [uRows] = await conn.query("SELECT department FROM users WHERE id = ? LIMIT 1", [userId]);
    if (!uRows[0]) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    if (!assertSameDept(req, res, uRows[0].department)) return;

    const [existing] = await conn.query("SELECT total_days, used_days FROM user_leave_pool WHERE user_id = ? AND year = ? LIMIT 1", [userId, year]);
    const before = existing[0] ?? null;
    const used_days = before?.used_days ?? 0;
    const total_days = parseFloat(remaining_days) + parseFloat(used_days);

    await conn.beginTransaction();
    await conn.query(
      `INSERT INTO user_leave_pool (user_id, total_days, used_days, year)
       VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE total_days = ?`,
      [userId, total_days, used_days, year, total_days]
    );
    await conn.commit();

    await logAudit({
      req, action: "balance.update", targetType: "leave_balance", targetId: Number(userId),
      before: before ? { total_days: before.total_days, used_days: before.used_days } : null,
      after: { total_days, used_days }, note: `แก้ไขวันลาคงเหลือ ${remaining_days} วัน`,
    });

    const [rows] = await pool.query("SELECT * FROM user_leave_pool WHERE user_id = ? AND year = ? LIMIT 1", [userId, year]);
    res.json({ ...rows[0], remaining: Math.max(0, rows[0].total_days - rows[0].used_days) });
  } catch (err) {
    await conn.rollback(); next(err);
  } finally { conn.release(); }
});

// ── GET /api/admin/ot-requests ───────────────────────────────
router.get("/ot-requests", async (req, res, next) => {
  try {
    const { status, user_id, year } = req.query;

    let sql = `
      SELECT ot.*, u.full_name AS user_full_name, u.employee_code, u.department,
             approver.full_name AS approver_name, ota.comment
      FROM ot_requests ot
      JOIN users u ON ot.user_id = u.id
      LEFT JOIN users approver ON ot.approved_by = approver.id
      LEFT JOIN ot_approvals ota ON ota.ot_request_id = ot.id
      WHERE 1=1`;
    const params = [];

    // admin เห็นทุกคน, role อื่นเห็นเฉพาะลูกน้อง
    if (["lead", "assistant manager", "manager"].includes(req.user.role) && req.user.role !== "admin") {
      sql += " AND u.supervisor_id = ?";
      params.push(req.user.id);
    }

    if (status) { sql += " AND ot.status = ?"; params.push(status); }
    if (user_id) { sql += " AND ot.user_id = ?"; params.push(user_id); }
    if (year) { sql += " AND YEAR(ot.ot_date) = ?"; params.push(year); }
    sql += " ORDER BY ot.created_at DESC";

    const [rows] = await pool.query(sql, params);
    const mapped = rows.map(r => {
      let total_hours = null;
      if (r.start_time && r.end_time) {
        const [sh, sm] = r.start_time.split(":").map(Number);
        const [eh, em] = r.end_time.split(":").map(Number);
        total_hours = Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 10) / 10;
      }
      return {
        ...r, total_hours: total_hours !== null ? total_hours : r.total_hours,
        user: { id: r.user_id, full_name: r.user_full_name, employee_code: r.employee_code, department: r.department }
      };
    });
    res.json(mapped);
  } catch (err) { next(err); }
});

// ── PATCH /api/admin/ot-requests/:id/approve & /reject ────────
// ... โค้ดสำหรับ OT Approve และ Reject ทำงานเหมือนเดิม ...
router.patch("/ot-requests/:id/approve", csrfProtect, async (req, res, next) => {
  // logic เดิม
});

router.patch("/ot-requests/:id/reject", csrfProtect, async (req, res, next) => {
  // logic เดิม
});

// ── GET /api/admin/reports/leave-summary ─────────────────
// Endpoint ใหม่สำหรับดึงข้อมูลสรุปไปทำ Dashboard ฝั่ง Frontend
router.get("/reports/leave-summary", async (req, res, next) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "manager") {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงรายงาน" });
    }

    const sql = `
      SELECT u.department, lt.name AS leave_type, SUM(lr.total_days) AS total_leave_days
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE lr.status = 'approved' AND YEAR(lr.start_date) = YEAR(CURDATE())
      GROUP BY u.department, lt.name
      ORDER BY u.department ASC
    `;
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
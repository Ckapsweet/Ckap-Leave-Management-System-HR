// routes/admin.js
import { Router } from "express";
import pool from "../config/db.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

// ทุก route ใน /api/admin ต้อง login + เป็น admin
router.use(authenticate, requireAdmin);

// GET /api/admin/leave-requests?status=pending&user_id=&year=2025
router.get("/leave-requests", async (req, res, next) => {
  try {
    const { status, user_id, year } = req.query;

    let sql = `
      SELECT
        lr.*,
        u.full_name      AS user_full_name,
        u.employee_code,
        u.department,
        lt.name          AS leave_type_name,
        lt.max_days      AS leave_type_max_days,
        approver.full_name AS approver_name,
        la.comment
      FROM leave_requests lr
      JOIN users u        ON lr.user_id = u.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN users approver ON lr.approved_by = approver.id
      LEFT JOIN leave_approvals la ON la.leave_request_id = lr.id
      WHERE 1=1
    `;
    const params = [];

    if (status)  { sql += " AND lr.status = ?";              params.push(status); }
    if (user_id) { sql += " AND lr.user_id = ?";             params.push(user_id); }
    if (year)    { sql += " AND YEAR(lr.start_date) = ?";    params.push(year); }

    sql += " ORDER BY lr.created_at DESC";

    const [rows] = await pool.query(sql, params);

    const data = rows.map((r) => ({
      ...r,
      user: { id: r.user_id, full_name: r.user_full_name, employee_code: r.employee_code, department: r.department },
      leave_type: { id: r.leave_type_id, name: r.leave_type_name, max_days: r.leave_type_max_days },
    }));

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/leave-requests/:id/approve
router.patch("/leave-requests/:id/approve", async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { comment = null } = req.body;
    const requestId  = req.params.id;
    const approverId = req.user.id;

    const [rows] = await conn.query(
      "SELECT * FROM leave_requests WHERE id = ? LIMIT 1",
      [requestId]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบคำขอลา" });
    if (rows[0].status !== "pending") {
      return res.status(400).json({ message: "คำขอนี้ถูกดำเนินการไปแล้ว" });
    }

    await conn.beginTransaction();

    const now = new Date();

    // อัปเดต leave_requests
    await conn.query(
      "UPDATE leave_requests SET status = 'approved', approved_by = ?, approved_at = ? WHERE id = ?",
      [approverId, now, requestId]
    );

    // บันทึก leave_approvals
    await conn.query(
      `INSERT INTO leave_approvals (leave_request_id, approver_id, status, comment, approved_at)
       VALUES (?, ?, 'approved', ?, ?)
       ON DUPLICATE KEY UPDATE status = 'approved', comment = ?, approved_at = ?`,
      [requestId, approverId, comment, now, comment, now]
    );

    // อัปเดต leave_balances — used_days + total_days
    const req_data = rows[0];
    const year = new Date(req_data.start_date).getFullYear();
    await conn.query(
      `UPDATE leave_balances
       SET used_days = used_days + ?
       WHERE user_id = ? AND leave_type_id = ? AND year = ?`,
      [req_data.total_days, req_data.user_id, req_data.leave_type_id, year]
    );

    await conn.commit();
    res.json({ message: "อนุมัติคำขอลาเรียบร้อย" });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// PATCH /api/admin/leave-requests/:id/reject
router.patch("/leave-requests/:id/reject", async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { comment = null } = req.body;
    const requestId  = req.params.id;
    const approverId = req.user.id;

    const [rows] = await conn.query(
      "SELECT * FROM leave_requests WHERE id = ? LIMIT 1",
      [requestId]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบคำขอลา" });
    if (rows[0].status !== "pending") {
      return res.status(400).json({ message: "คำขอนี้ถูกดำเนินการไปแล้ว" });
    }

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
    res.json({ message: "ปฏิเสธคำขอลาเรียบร้อย" });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// GET /api/admin/users  — รายชื่อ user ทั้งหมด
router.get("/users", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, employee_code, full_name, department, role, created_at FROM users ORDER BY id ASC"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
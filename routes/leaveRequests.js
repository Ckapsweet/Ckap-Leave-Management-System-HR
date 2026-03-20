// routes/leaveRequests.js
import { Router } from "express";
import pool from "../config/db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// GET /api/leave-requests/my  — ประวัติการลาของ user ที่ login
router.get("/my", authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         lr.*,
         lt.name        AS leave_type_name,
         lt.description AS leave_type_description,
         lt.max_days    AS leave_type_max_days,
         u.full_name    AS approver_name,
         la.comment
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       LEFT JOIN users u   ON lr.approved_by = u.id
       LEFT JOIN leave_approvals la ON la.leave_request_id = lr.id
       WHERE lr.user_id = ?
       ORDER BY lr.created_at DESC`,
      [req.user.id]
    );

    // map leave_type เป็น nested object เหมือน frontend ใช้
    const data = rows.map((r) => ({
      ...r,
      leave_type: {
        id:          r.leave_type_id,
        name:        r.leave_type_name,
        description: r.leave_type_description,
        max_days:    r.leave_type_max_days,
      },
    }));

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/leave-requests/:id  — ดูรายละเอียด
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         lr.*,
         lt.name        AS leave_type_name,
         lt.description AS leave_type_description,
         lt.max_days    AS leave_type_max_days,
         u.full_name    AS approver_name,
         la.comment
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       LEFT JOIN users u   ON lr.approved_by = u.id
       LEFT JOIN leave_approvals la ON la.leave_request_id = lr.id
       WHERE lr.id = ? AND lr.user_id = ?
       LIMIT 1`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบคำขอลา" });

    const r = rows[0];
    res.json({
      ...r,
      leave_type: {
        id:          r.leave_type_id,
        name:        r.leave_type_name,
        description: r.leave_type_description,
        max_days:    r.leave_type_max_days,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/leave-requests  — ส่งคำขอลาใหม่
router.post("/", authenticate, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      leave_type_id,
      start_date,
      end_date,
      start_time = null,
      end_time   = null,
      total_days,
      reason,
    } = req.body;

    if (!leave_type_id || !start_date || !end_date || !reason) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    // ตรวจสอบ leave_type
    const [types] = await conn.query(
      "SELECT * FROM leave_types WHERE id = ? LIMIT 1",
      [leave_type_id]
    );
    if (!types[0]) return res.status(400).json({ message: "ประเภทการลาไม่ถูกต้อง" });

    // ตรวจสอบว่าวันไม่ทับซ้อนกับคำขอที่ approved
    const [overlap] = await conn.query(
      `SELECT id FROM leave_requests
       WHERE user_id = ?
         AND status = 'approved'
         AND start_date <= ? AND end_date >= ?`,
      [req.user.id, end_date, start_date]
    );
    if (overlap.length > 0) {
      return res.status(409).json({ message: "วันที่ลาทับซ้อนกับคำขอที่อนุมัติแล้ว" });
    }

    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO leave_requests
         (user_id, leave_type_id, start_date, end_date, start_time, end_time, total_days, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [req.user.id, leave_type_id, start_date, end_date, start_time, end_time, total_days, reason]
    );

    await conn.commit();

    // ดึงข้อมูลที่เพิ่งสร้างกลับมา
    const [rows] = await pool.query(
      `SELECT lr.*, lt.name AS leave_type_name, lt.description AS leave_type_description, lt.max_days AS leave_type_max_days
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.id = ?`,
      [result.insertId]
    );
    const r = rows[0];
    res.status(201).json({
      ...r,
      leave_type: { id: r.leave_type_id, name: r.leave_type_name, description: r.leave_type_description, max_days: r.leave_type_max_days },
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// DELETE /api/leave-requests/:id  — ยกเลิกคำขอ (เฉพาะ pending)
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM leave_requests WHERE id = ? AND user_id = ? LIMIT 1",
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบคำขอลา" });
    if (rows[0].status !== "pending") {
      return res.status(400).json({ message: "ยกเลิกได้เฉพาะคำขอที่ยังรออนุมัติ" });
    }

    await pool.query("DELETE FROM leave_requests WHERE id = ?", [req.params.id]);
    res.json({ message: "ยกเลิกคำขอลาเรียบร้อย" });
  } catch (err) {
    next(err);
  }
});

export default router;
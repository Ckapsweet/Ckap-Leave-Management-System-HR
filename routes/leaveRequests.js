// routes/leaveRequests.js
import { Router } from "express";
import pool from "../config/db.js";
import { authenticate, csrfProtect } from "../middleware/auth.js";
import { logAudit } from "../middleware/audit.js";

const router = Router();

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
    leave_type: {
      id: r.leave_type_id,
      name: r.leave_type_name,
      description: r.leave_type_description,
      max_days: r.leave_type_max_days,
    },
  };
}

// ── GET /api/leave-requests/today ─────────────────────────────
router.get("/today", authenticate, async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [rows] = await pool.query(
      `SELECT lr.*, u.full_name AS user_name, u.department AS user_department,
              lt.name AS leave_type_name, lt.description AS leave_type_description,
              lt.max_days AS leave_type_max_days
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.status = 'approved'
         AND ? BETWEEN lr.start_date AND lr.end_date
       ORDER BY lr.start_date DESC`,
      [today]
    );
    res.json(rows.map(r => ({
      ...mapRow(r),
      user: {
        id: r.user_id,
        full_name: r.user_name,
        department: r.user_department,
      },
    })));
  } catch (err) { next(err); }
});

// ── GET /api/leave-requests/my ────────────────────────────────
router.get("/my", authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT lr.*, lt.name AS leave_type_name, lt.description AS leave_type_description,
              lt.max_days AS leave_type_max_days, u.full_name AS approver_name, la.comment
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       LEFT JOIN users u ON lr.approved_by = u.id
       LEFT JOIN leave_approvals la ON la.leave_request_id = lr.id
       WHERE lr.user_id = ?
       ORDER BY lr.created_at DESC`,
      [req.user.id]
    );
    res.json(rows.map(mapRow));
  } catch (err) { next(err); }
});

// ── GET /api/leave-requests/report/monthly?year= ─────────────
router.get("/report/monthly", authenticate, async (req, res, next) => {
  try {
    const year = req.query.year ?? new Date().getFullYear();
    const [rows] = await pool.query(
      `SELECT
         MONTH(start_date) AS month,
         lt.name           AS leave_type,
         lt.id             AS leave_type_id,
         COUNT(*)          AS count,
         SUM(total_days)   AS total_days
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.user_id = ?
         AND YEAR(lr.start_date) = ?
         AND lr.status = 'approved'
       GROUP BY MONTH(start_date), lt.id
       ORDER BY month ASC`,
      [req.user.id, year]
    );
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      month_name: new Date(2000, i, 1).toLocaleString("th-TH", { month: "short" }),
      total_days: 0,
      by_type: {},
    }));
    rows.forEach((r) => {
      const m = months[r.month - 1];
      m.total_days += parseFloat(r.total_days);
      m.by_type[r.leave_type] = (m.by_type[r.leave_type] ?? 0) + parseFloat(r.total_days);
    });
    res.json({ year: Number(year), months });
  } catch (err) { next(err); }
});

// ── GET /api/leave-requests/report/yearly ────────────────────
router.get("/report/yearly", authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         YEAR(start_date)  AS year,
         lt.name           AS leave_type,
         lt.id             AS leave_type_id,
         COUNT(*)          AS count,
         SUM(total_days)   AS total_days
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.user_id = ?
         AND lr.status = 'approved'
       GROUP BY YEAR(start_date), lt.id
       ORDER BY year DESC`,
      [req.user.id]
    );
    const yearMap = {};
    rows.forEach((r) => {
      if (!yearMap[r.year]) yearMap[r.year] = { year: r.year, total_days: 0, by_type: {} };
      yearMap[r.year].total_days += parseFloat(r.total_days);
      yearMap[r.year].by_type[r.leave_type] = (yearMap[r.year].by_type[r.leave_type] ?? 0) + parseFloat(r.total_days);
    });
    res.json(Object.values(yearMap).sort((a, b) => b.year - a.year));
  } catch (err) { next(err); }
});

// ── GET /api/leave-requests/:id ───────────────────────────────
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT lr.*, lt.name AS leave_type_name, lt.description AS leave_type_description,
              lt.max_days AS leave_type_max_days, u.full_name AS approver_name, la.comment
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       LEFT JOIN users u ON lr.approved_by = u.id
       LEFT JOIN leave_approvals la ON la.leave_request_id = lr.id
       WHERE lr.id = ? AND lr.user_id = ? LIMIT 1`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบคำขอลา" });
    res.json(mapRow(rows[0]));
  } catch (err) { next(err); }
});

// ── POST /api/leave-requests ──────────────────────────────────
router.post("/", authenticate, csrfProtect, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    console.log("[POST /leave-requests] body:", req.body);

    const {
      leave_type_id,
      start_date,
      end_date,
      start_time = null,
      end_time = null,
      total_days = 0,
      total_hours = null,
      reason,
    } = req.body;

    if (!leave_type_id || !start_date || !end_date || !reason) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    const [types] = await conn.query(
      "SELECT * FROM leave_types WHERE id = ? LIMIT 1", [leave_type_id]
    );
    if (!types[0]) return res.status(400).json({ message: "ประเภทการลาไม่ถูกต้อง" });

    const isHour = !!start_time;
    const totalDaysToSave = isHour
      ? parseFloat(((total_hours ?? 0) / 8).toFixed(2))
      : total_days;

    const year = new Date(start_date).getFullYear();

    const [poolRows] = await conn.query(
      "SELECT * FROM user_leave_pool WHERE user_id = ? AND year = ? LIMIT 1",
      [req.user.id, year]
    );
    let userPool = poolRows[0];

    if (!userPool) {
      await conn.query(
        `INSERT INTO user_leave_pool (user_id, total_days, used_days, year)
         VALUES (?, 15, 0, ?)
         ON DUPLICATE KEY UPDATE id = id`,
        [req.user.id, year]
      );
      const [newPool] = await conn.query(
        "SELECT * FROM user_leave_pool WHERE user_id = ? AND year = ? LIMIT 1",
        [req.user.id, year]
      );
      userPool = newPool[0];
    }

    const remaining = parseFloat(userPool.total_days) - parseFloat(userPool.used_days);
    if (remaining < totalDaysToSave) {
      return res.status(400).json({
        message: `วันลาคงเหลือไม่เพียงพอ (คงเหลือ ${remaining} วัน ต้องการ ${totalDaysToSave} วัน)`,
      });
    }

    if (!isHour) {
      const [overlap] = await conn.query(
        `SELECT id FROM leave_requests
         WHERE user_id = ? AND status = 'approved'
           AND start_time IS NULL
           AND start_date <= ? AND end_date >= ?`,
        [req.user.id, end_date, start_date]
      );
      if (overlap.length > 0) {
        return res.status(409).json({ message: "วันที่ลาทับซ้อนกับคำขอที่อนุมัติแล้ว" });
      }
    }

    await conn.beginTransaction();

    const isAutoApprove = req.user.role === "manager";
    const finalStatus = isAutoApprove ? "approved" : "pending";
    const approvedBy = isAutoApprove ? req.user.id : null;
    const approvedAt = isAutoApprove ? new Date() : null;

    // ── FIXED: หา assignee แรกในสาย (ต้องเป็น lead) ──────────
    let assigneeId = null;
    if (!isAutoApprove) {
      // ดึง supervisor ของ user และตรวจ role
      const [supRows] = await conn.query(
        `SELECT u2.id, u2.role
         FROM users u1
         JOIN users u2 ON u2.id = u1.supervisor_id
         WHERE u1.id = ?`,
        [req.user.id]
      );

      if (supRows[0]) {
        // supervisor มีอยู่และ role ถูกต้อง → ใช้เลย
        assigneeId = supRows[0].id;
      } else {
        // ไม่มี supervisor → fallback หา lead ใน department เดียวกัน
        const [leadRows] = await conn.query(
          `SELECT id FROM users
           WHERE department = (SELECT department FROM users WHERE id = ?)
             AND role = 'lead'
           LIMIT 1`,
          [req.user.id]
        );
        assigneeId = leadRows[0]?.id ?? null;
        // ถ้าไม่มี lead ใน dept → หา assistant manager
        if (!assigneeId) {
          const [amRows] = await conn.query(
            `SELECT id FROM users
             WHERE department = (SELECT department FROM users WHERE id = ?)
               AND role = 'assistant manager'
             LIMIT 1`,
            [req.user.id]
          );
          assigneeId = amRows[0]?.id ?? null;
        }
      }
    }

    const [result] = await conn.query(
      `INSERT INTO leave_requests
         (user_id, leave_type_id, start_date, end_date, start_time, end_time, total_days, reason, status, approved_by, approved_at, current_assignee_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, leave_type_id, start_date, end_date, start_time, end_time, totalDaysToSave, reason, finalStatus, approvedBy, approvedAt, assigneeId]
    );

    if (isAutoApprove) {
      await conn.query(
        `INSERT INTO leave_approvals (leave_request_id, approver_id, status, comment, approved_at)
         VALUES (?, ?, 'approved', 'อนุมัติอัตโนมัติ (สิทธิ์ Manager)', ?)`,
        [result.insertId, req.user.id, approvedAt]
      );
      await conn.query(
        `UPDATE user_leave_pool
         SET used_days = used_days + ?
         WHERE user_id = ? AND year = ?`,
        [totalDaysToSave, req.user.id, year]
      );
    }

    await conn.commit();

    const [rows] = await pool.query(
      `SELECT lr.*, lt.name AS leave_type_name, lt.description AS leave_type_description,
              lt.max_days AS leave_type_max_days
       FROM leave_requests lr JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.id = ?`,
      [result.insertId]
    );
    const created = mapRow(rows[0]);

    await logAudit({
      req,
      action: "leave.create",
      targetType: "leave_request",
      targetId: result.insertId,
      after: {
        leave_type_id,
        start_date,
        end_date,
        start_time,
        end_time,
        total_days: totalDaysToSave,
        reason,
        status: finalStatus,
      },
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("[POST /leave-requests] error:", err.message, err.sqlMessage ?? "");
    await conn.rollback();
    next(err);
  } finally { conn.release(); }
});

// ── DELETE /api/leave-requests/:id  (user cancel) ────────────
router.delete("/:id", authenticate, csrfProtect, async (req, res, next) => {
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

    await logAudit({
      req,
      action: "leave.cancel",
      targetType: "leave_request",
      targetId: rows[0].id,
      before: {
        status: rows[0].status,
        start_date: rows[0].start_date,
        end_date: rows[0].end_date,
        total_days: rows[0].total_days,
        reason: rows[0].reason,
      },
    });

    res.json({ message: "ยกเลิกคำขอลาเรียบร้อย" });
  } catch (err) { next(err); }
});

export default router;
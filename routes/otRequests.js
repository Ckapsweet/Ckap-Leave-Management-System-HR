// routes/otRequests.js
import { Router } from "express";
import pool from "../config/db.js";
import { authenticate, csrfProtect } from "../middleware/auth.js";
import { logAudit } from "../middleware/audit.js";

const router = Router();

// ── helper ────────────────────────────────────────────────────
function mapRow(r) {
  let total_hours = null;
  if (r.start_time && r.end_time) {
    const [sh, sm] = r.start_time.split(":").map(Number);
    const [eh, em] = r.end_time.split(":").map(Number);
    total_hours = Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 10) / 10;
  }
  return {
    ...r,
    total_hours: total_hours !== null ? total_hours : r.total_hours,
  };
}

// ── GET /api/ot-requests/my ───────────────────────────────────
router.get("/my", authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT ot.*, approver.full_name AS approver_name, ota.comment
       FROM ot_requests ot
       LEFT JOIN users approver ON ot.approved_by = approver.id
       LEFT JOIN ot_approvals ota ON ota.ot_request_id = ot.id
       WHERE ot.user_id = ?
       ORDER BY ot.created_at DESC`,
      [req.user.id]
    );
    res.json(rows.map(mapRow));
  } catch (err) { next(err); }
});

// ── GET /api/ot-requests/report/monthly?year= ─────────────────
router.get("/report/monthly", authenticate, async (req, res, next) => {
  try {
    const year = req.query.year ?? new Date().getFullYear();
    const [rows] = await pool.query(
      `SELECT
         MONTH(ot_date)    AS month,
         COUNT(*)          AS count,
         SUM(total_hours)  AS total_hours
       FROM ot_requests
       WHERE user_id = ?
         AND YEAR(ot_date) = ?
         AND status = 'approved'
       GROUP BY MONTH(ot_date)
       ORDER BY month ASC`,
      [req.user.id, year]
    );
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      month_name: new Date(2000, i, 1).toLocaleString("th-TH", { month: "short" }),
      total_hours: 0,
      count: 0
    }));
    rows.forEach((r) => {
      const m = months[r.month - 1];
      m.total_hours += parseFloat(r.total_hours);
      m.count += parseInt(r.count, 10);
    });
    res.json({ year: Number(year), months });
  } catch (err) { next(err); }
});

// ── GET /api/ot-requests/report/yearly ─────────────────────────
router.get("/report/yearly", authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         YEAR(ot_date)     AS year,
         COUNT(*)          AS count,
         SUM(total_hours)  AS total_hours
       FROM ot_requests
       WHERE user_id = ?
         AND status = 'approved'
       GROUP BY YEAR(ot_date)
       ORDER BY year DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// ── GET /api/ot-requests/:id ──────────────────────────────────
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT ot.*, approver.full_name AS approver_name, ota.comment
       FROM ot_requests ot
       LEFT JOIN users approver ON ot.approved_by = approver.id
       LEFT JOIN ot_approvals ota ON ota.ot_request_id = ot.id
       WHERE ot.id = ? AND ot.user_id = ? LIMIT 1`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบคำขอ OT" });
    res.json(mapRow(rows[0]));
  } catch (err) { next(err); }
});

// ── POST /api/ot-requests ─────────────────────────────────────
router.post("/", authenticate, csrfProtect, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { ot_date, start_time, end_time, reason } = req.body;

    if (!ot_date || !start_time || !end_time || !reason) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน (วันที่, เวลาเริ่ม, เวลาสิ้นสุด, เหตุผล)" });
    }

    const [sh, sm] = start_time.split(":").map(Number);
    const [eh, em] = end_time.split(":").map(Number);
    const total_hours = Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 10) / 10;

    if (total_hours <= 0) {
      return res.status(400).json({ message: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น" });
    }

    // Overlap check
    const [overlap] = await conn.query(
      `SELECT id FROM ot_requests
       WHERE user_id = ? AND ot_date = ? AND status != 'rejected'
         AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))`,
      [req.user.id, ot_date, end_time, start_time, end_time, start_time]
    );
    if (overlap.length > 0) {
      return res.status(409).json({ message: "เวลา OT ทับซ้อนกับคำขออื่นในระบบ" });
    }

    await conn.beginTransaction();

    const [u] = await conn.query("SELECT supervisor_id FROM users WHERE id = ?", [req.user.id]);
    const assigneeId = u[0]?.supervisor_id || null;

    const [result] = await conn.query(
      `INSERT INTO ot_requests
         (user_id, ot_date, start_time, end_time, total_hours, reason, status, current_assignee_id)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [req.user.id, ot_date, start_time, end_time, total_hours, reason, assigneeId]
    );
    await conn.commit();

    const [rows] = await pool.query(
      `SELECT ot.*, approver.full_name AS approver_name, ota.comment
       FROM ot_requests ot
       LEFT JOIN users approver ON ot.approved_by = approver.id
       LEFT JOIN ot_approvals ota ON ota.ot_request_id = ot.id
       WHERE ot.id = ?`,
      [result.insertId]
    );
    const created = mapRow(rows[0]);

    await logAudit({
      req,
      action: "ot.create",
      targetType: "ot_request",
      targetId: result.insertId,
      after: {
        ot_date,
        start_time,
        end_time,
        total_hours,
        reason,
        status: "pending",
      },
    });

    res.status(201).json(created);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally { conn.release(); }
});

// ── DELETE /api/ot-requests/:id  (user cancel) ───────────────
router.delete("/:id", authenticate, csrfProtect, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM ot_requests WHERE id = ? AND user_id = ? LIMIT 1",
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบคำขอ OT" });
    if (rows[0].status !== "pending") {
      return res.status(400).json({ message: "ยกเลิกได้เฉพาะคำขอที่ยังรออนุมัติ" });
    }

    await pool.query("DELETE FROM ot_requests WHERE id = ?", [req.params.id]);

    // ── audit log ─────────────────────────────────────────────
    await logAudit({
      req,
      action: "ot.cancel",
      targetType: "ot_request",
      targetId: rows[0].id,
      before: {
        status: rows[0].status,
        ot_date: rows[0].ot_date,
        start_time: rows[0].start_time,
        end_time: rows[0].end_time,
        total_hours: rows[0].total_hours,
        reason: rows[0].reason,
      },
    });

    res.json({ message: "ยกเลิกคำขอ OT เรียบร้อย" });
  } catch (err) { next(err); }
});

export default router;

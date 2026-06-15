// routes/leaveRequests.js
import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import pool from "../config/db.js";
import { authenticate, csrfProtect } from "../middleware/auth.js";
import { logAudit } from "../middleware/audit.js";
import { leaveAttachmentDir, normalizeOriginalName, uploadLeaveAttachments } from "../middleware/upload.js";
import { notifyLeaveRequestCreated, notifyLeaveRequestSubmitted } from "../services/mailService.js";
import { calculateLeaveHours, leaveHoursToDays } from "../services/leaveTime.js";
import { mapLeaveRequestRow } from "../services/leaveRequestHelpers.js";

const router = Router();

const latestLeaveApprovalJoin = `
       LEFT JOIN (
         SELECT la1.*
         FROM leave_approvals la1
         JOIN (
           SELECT leave_request_id, MAX(id) AS id
           FROM leave_approvals
           GROUP BY leave_request_id
         ) latest_la ON latest_la.id = la1.id
       ) la ON la.leave_request_id = lr.id`;

function yearBounds(year) {
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear) || numericYear < 1000 || numericYear > 9999) return null;
  return [`${numericYear}-01-01`, `${numericYear + 1}-01-01`];
}

// ── helper ────────────────────────────────────────────────────
function mapRow(r) {
  return mapLeaveRequestRow(r);
}

function attachmentUrl(id) {
  return `/api/leave-requests/attachments/${id}`;
}

async function attachFiles(rows) {
  if (!rows.length) return rows;
  const ids = rows.map((r) => r.id);
  const [files] = await pool.query(
    `SELECT id, leave_request_id, original_name, stored_name, mime_type, size
     FROM leave_request_attachments
     WHERE leave_request_id IN (?)
     ORDER BY id ASC`,
    [ids]
  );
  const byRequest = new Map();
  files.forEach((file) => {
    const item = {
      id: file.id,
      original_name: file.original_name,
      file_name: file.original_name,
      mime_type: file.mime_type,
      size: file.size,
      url: attachmentUrl(file.id),
    };
    byRequest.set(file.leave_request_id, [...(byRequest.get(file.leave_request_id) ?? []), item]);
  });
  return rows.map((row) => ({ ...row, attachments: byRequest.get(row.id) ?? [] }));
}

async function canAccessAttachment(req, leaveRequest) {
  if (leaveRequest.user_id === req.user.id) return true;
  if (req.user.role === "admin") return true;
  if (req.user.role === "manager") return req.user.department === leaveRequest.department;
  if (["lead", "assistant manager"].includes(req.user.role)) {
    return leaveRequest.supervisor_id === req.user.id || leaveRequest.current_assignee_id === req.user.id;
  }
  return false;
}

function hasEmail(user) {
  return Boolean(user?.email || user?.email_2);
}

function queueLeaveRequestNotifications({ leaveRequest, requester, status, assignee, isAutoApprove }) {
  setImmediate(() => {
    void (async () => {
      await notifyLeaveRequestSubmitted({
        leaveRequest,
        requester,
        status,
        assignee,
      });

      if (!isAutoApprove) {
        await notifyLeaveRequestCreated({
          leaveRequest,
          requester,
          assignee,
        });
      }
    })().catch((err) => {
      console.error("[mail] leave request notification failed:", err.message);
    });
  });
}

async function findInitialAssignee(conn, userId) {
  const [supRows] = await conn.query(
    `SELECT u2.id, u2.role, u2.email, u2.email_2, u2.department
     FROM users u1
     JOIN users u2 ON u2.id = u1.supervisor_id
     WHERE u1.id = ? AND u1.is_active = 1 AND u2.is_active = 1
     LIMIT 1`,
    [userId]
  );

  if (hasEmail(supRows[0])) return supRows[0].id;

  const [fallbackRows] = await conn.query(
    `SELECT id, role, email, email_2
     FROM users
     WHERE department = (SELECT department FROM users WHERE id = ? AND is_active = 1)
       AND role IN ('lead', 'assistant manager', 'manager')
       AND is_active = 1
       AND (
         (email IS NOT NULL AND TRIM(email) <> '')
         OR (email_2 IS NOT NULL AND TRIM(email_2) <> '')
       )
     ORDER BY FIELD(role, 'lead', 'assistant manager', 'manager'), id ASC
     LIMIT 1`,
    [userId]
  );

  if (fallbackRows[0]) {
    console.warn("[mail] initial assignee fallback selected", {
      userId,
      originalAssigneeId: supRows[0]?.id ?? null,
      originalAssigneeRole: supRows[0]?.role ?? null,
      selectedAssigneeId: fallbackRows[0].id,
      selectedAssigneeRole: fallbackRows[0].role,
      reason: supRows[0] ? "supervisor_missing_email" : "missing_supervisor",
    });
  }

  return fallbackRows[0]?.id ?? supRows[0]?.id ?? null;
}

// ── GET /api/leave-requests/today ─────────────────────────────
router.get("/today", authenticate, async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [rows] = await pool.query(
      `SELECT lr.*, u.full_name AS user_name, u.department AS user_department,
              u.email AS user_email, u.email_2 AS user_email_2, u.phone AS user_phone,
              lt.name AS leave_type_name, lt.description AS leave_type_description,
              lt.max_days AS leave_type_max_days
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.status = 'approved'
         AND u.department = ?
         AND ? BETWEEN lr.start_date AND lr.end_date
       ORDER BY lr.start_date DESC`,
      [req.user.department, today]
    );
    res.json(rows.map(r => ({
      ...mapRow(r),
      user: {
        id: r.user_id,
        full_name: r.user_name,
        department: r.user_department,
        email: r.user_email,
        email_2: r.user_email_2,
        phone: r.user_phone,
      },
    })));
  } catch (err) { next(err); }
});

// ── GET /api/leave-requests/week ──────────────────────────────
router.get("/week", authenticate, async (req, res, next) => {
  try {
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 6);

    const startDate = today.toISOString().split("T")[0];
    const endDate = weekEnd.toISOString().split("T")[0];

    const [rows] = await pool.query(
      `SELECT lr.*, u.full_name AS user_name, u.department AS user_department,
              u.email AS user_email, u.email_2 AS user_email_2, u.phone AS user_phone,
              lt.name AS leave_type_name, lt.description AS leave_type_description,
              lt.max_days AS leave_type_max_days
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.status = 'approved'
         AND u.department = ?
         AND lr.start_date <= ?
         AND lr.end_date >= ?
       ORDER BY lr.start_date ASC, u.full_name ASC`,
      [req.user.department, endDate, startDate]
    );

    res.json(rows.map(r => ({
      ...mapRow(r),
      user: {
        id: r.user_id,
        full_name: r.user_name,
        department: r.user_department,
        email: r.user_email,
        email_2: r.user_email_2,
        phone: r.user_phone,
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
       ${latestLeaveApprovalJoin}
       WHERE lr.user_id = ?
       ORDER BY lr.created_at DESC`,
      [req.user.id]
    );
    res.json(await attachFiles(rows.map(mapRow)));
  } catch (err) { next(err); }
});

// ── GET /api/leave-requests/report/monthly?year= ─────────────
router.get("/report/monthly", authenticate, async (req, res, next) => {
  try {
    const year = req.query.year ?? new Date().getFullYear();
    const range = yearBounds(year);
    if (!range) return res.status(400).json({ message: "year ไม่ถูกต้อง" });
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
         AND lr.start_date >= ?
         AND lr.start_date < ?
         AND lr.status = 'approved'
       GROUP BY MONTH(start_date), lt.id
       ORDER BY month ASC`,
      [req.user.id, ...range]
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

// ── GET /api/leave-requests/attachments/:attachmentId ──────────
router.get("/attachments/:attachmentId", authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT lra.*, lr.user_id, lr.current_assignee_id, u.department, u.supervisor_id
       FROM leave_request_attachments lra
       JOIN leave_requests lr ON lr.id = lra.leave_request_id
       JOIN users u ON u.id = lr.user_id
       WHERE lra.id = ?
       LIMIT 1`,
      [req.params.attachmentId]
    );
    const file = rows[0];
    if (!file) return res.status(404).json({ message: "ไม่พบไฟล์แนบ" });
    if (!(await canAccessAttachment(req, file))) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงไฟล์แนบ" });
    }

    const filePath = path.resolve(leaveAttachmentDir, file.stored_name);
    if (!filePath.startsWith(leaveAttachmentDir)) {
      return res.status(400).json({ message: "ไฟล์แนบไม่ถูกต้อง" });
    }
    res.type(file.mime_type);
    res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(file.original_name)}`);
    res.sendFile(filePath);
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
       ${latestLeaveApprovalJoin}
       WHERE lr.id = ? AND lr.user_id = ? LIMIT 1`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบคำขอลา" });
    const [mapped] = await attachFiles([mapRow(rows[0])]);
    res.json(mapped);
  } catch (err) { next(err); }
});

// ── POST /api/leave-requests ──────────────────────────────────
router.post("/", authenticate, csrfProtect, uploadLeaveAttachments.array("attachments", 10), async (req, res, next) => {
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
      request_type = "leave",
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
    const totalHoursToSave = isHour ? calculateLeaveHours(start_time, end_time) : null;
    if (isHour && (!end_time || totalHoursToSave <= 0)) {
      return res.status(400).json({ message: "กรุณาระบุช่วงเวลาลาให้ถูกต้อง" });
    }
    const totalDaysToSave = isHour
      ? leaveHoursToDays(totalHoursToSave)
      : Number(total_days);

    const year = new Date(start_date).getFullYear();

    const [balRows] = await conn.query(
      `SELECT * FROM leave_balances
       WHERE user_id = ? AND leave_type_id = ? AND year = ?
       LIMIT 1`,
      [req.user.id, leave_type_id, year]
    );
    let currentBalance = balRows[0];

    // ถ้ายังไม่มี row ใน leave_balances → ใช้ค่า default จาก leave_types
    const maxAllowed = currentBalance ? parseFloat(currentBalance.total_days) : parseFloat(types[0].max_days);
    const used = currentBalance ? parseFloat(currentBalance.used_days) : 0;
    const remaining = maxAllowed - used;

    if (remaining < totalDaysToSave) {
      return res.status(400).json({
        message: `วันลา${types[0].name}คงเหลือไม่เพียงพอ (คงเหลือ ${remaining} วัน ต้องการ ${totalDaysToSave} วัน)`,
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

    // ── FIXED: หา assignee แรกในสาย และเลี่ยงคนที่ไม่มีอีเมลถ้ามี fallback ──────────
    let assigneeId = null;
    if (!isAutoApprove) {
      assigneeId = await findInitialAssignee(conn, req.user.id);
    }

    const [result] = await conn.query(
      `INSERT INTO leave_requests
         (user_id, leave_type_id, start_date, end_date, start_time, end_time, total_days, request_type, reason, status, approved_by, approved_at, current_assignee_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, leave_type_id, start_date, end_date, start_time, end_time, totalDaysToSave, request_type, reason, finalStatus, approvedBy, approvedAt, assigneeId]
    );

    if (req.files?.length) {
      const values = req.files.map((file) => [
        result.insertId,
        normalizeOriginalName(file.originalname),
        file.filename,
        file.mimetype,
        file.size,
      ]);
      await conn.query(
        `INSERT INTO leave_request_attachments
           (leave_request_id, original_name, stored_name, mime_type, size)
         VALUES ?`,
        [values]
      );
    }

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
      await conn.query(
        `INSERT INTO leave_balances (user_id, leave_type_id, total_days, used_days, year)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE used_days = used_days + ?`,
        [req.user.id, leave_type_id, maxAllowed, totalDaysToSave, year, totalDaysToSave]
      );
    }

    await conn.commit();

    const [rows] = await pool.query(
      `SELECT lr.*, lt.name AS leave_type_name, lt.description AS leave_type_description,
              lt.max_days AS leave_type_max_days,
              requester.full_name AS requester_full_name,
              requester.employee_code AS requester_employee_code,
              requester.email AS requester_email,
              requester.email_2 AS requester_email_2,
              assignee.full_name AS assignee_full_name,
              assignee.employee_code AS assignee_employee_code,
              assignee.email AS assignee_email,
              assignee.email_2 AS assignee_email_2
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       JOIN users requester ON requester.id = lr.user_id
       LEFT JOIN users assignee ON assignee.id = lr.current_assignee_id
       WHERE lr.id = ?`,
      [result.insertId]
    );
    const created = mapRow(rows[0]);
    const requester = {
      full_name: rows[0].requester_full_name || req.user.full_name,
      employee_code: rows[0].requester_employee_code || req.user.employee_code,
      email: rows[0].requester_email || req.user.email,
      email_2: rows[0].requester_email_2 || req.user.email_2,
    };
    const assignee = rows[0].assignee_employee_code ? {
      full_name: rows[0].assignee_full_name,
      employee_code: rows[0].assignee_employee_code,
      email: rows[0].assignee_email,
      email_2: rows[0].assignee_email_2,
    } : null;

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
        request_type,
        reason,
        status: finalStatus,
        attachments: req.files?.map((file) => ({ original_name: normalizeOriginalName(file.originalname), mime_type: file.mimetype, size: file.size })) ?? [],
      },
    });

    res.status(201).json(created);

    queueLeaveRequestNotifications({
      leaveRequest: rows[0],
      requester,
      status: finalStatus,
      assignee,
      isAutoApprove,
    });
  } catch (err) {
    console.error("[POST /leave-requests] error:", err.message, err.sqlMessage ?? "");
    await conn.rollback();
    if (req.files?.length) {
      await Promise.allSettled(
        req.files.map((file) => fs.unlink(path.resolve(leaveAttachmentDir, file.filename)))
      );
    }
    next(err);
  } finally { conn.release(); }
});

// ── DELETE /api/leave-requests/:id  (user cancel) ────────────
router.delete("/:id", authenticate, csrfProtect, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      "SELECT * FROM leave_requests WHERE id = ? AND user_id = ? LIMIT 1",
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบคำขอลา" });
    if (rows[0].status !== "pending") {
      return res.status(400).json({ message: "ยกเลิกได้เฉพาะคำขอที่ยังรออนุมัติ" });
    }

    const [files] = await conn.query(
      "SELECT stored_name FROM leave_request_attachments WHERE leave_request_id = ?",
      [req.params.id]
    );

    await conn.beginTransaction();
    await conn.query("DELETE FROM leave_approvals WHERE leave_request_id = ?", [req.params.id]);
    await conn.query("DELETE FROM leave_requests WHERE id = ?", [req.params.id]);

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
      conn,
    });

    await conn.commit();

    await Promise.allSettled(
      files.map((file) => fs.unlink(path.resolve(leaveAttachmentDir, file.stored_name)))
    );

    res.json({ message: "ยกเลิกคำขอลาเรียบร้อย" });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

export default router;

// routes/admin.js
import { Router } from "express";
import pool from "../config/db.js";
import { authenticate, requireAdmin, csrfProtect } from "../middleware/auth.js";
import { logAudit } from "../middleware/audit.js";
import { notifyLeaveRequestForwarded, notifyLeaveRequestResolved } from "../services/mailService.js";
import { calculateLeaveHours, leaveHoursToDays } from "../services/leaveTime.js";
import {
  approveWorkflowRequest,
  canActOnWorkflow,
  canManageDepartment,
  rejectWorkflowRequest,
} from "../services/approvalWorkflow.js";
import { mapLeaveRequestRow } from "../services/leaveRequestHelpers.js";

const router = Router();
router.use(authenticate, requireAdmin);

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
  return mapLeaveRequestRow(r, { includeUser: true });
}

function getLeaveDaysFromRow(row) {
  if (row.start_time && row.end_time) {
    return leaveHoursToDays(calculateLeaveHours(row.start_time, row.end_time));
  }
  return Number(row.total_days ?? 0);
}

function balanceKey(name, id) {
  return String(name ?? id).trim().toLowerCase();
}

function attachmentUrl(id) {
  return `/api/leave-requests/attachments/${id}`;
}

function hasEmail(user) {
  return Boolean(user?.email || user?.email_2);
}

async function attachLeaveFiles(rows) {
  if (!rows.length) return rows;
  const ids = rows.map((r) => r.id);
  const [files] = await pool.query(
    `SELECT id, leave_request_id, original_name, mime_type, size
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

function assertSameDept(req, res, dept) {
  if (canManageDepartment(req.user, dept)) return true;
  res.status(403).json({ message: "ไม่มีสิทธิ์จัดการพนักงานนอกแผนกของคุณ" });
  return false;
}

async function assertWorkflowRights(req, res, targetRow) {
  if (canActOnWorkflow(req.user, targetRow)) return true;
  res.status(403).json({ message: "ยังไม่ถึงลำดับการอนุมัติ" });
  return false;
}

router.get("/leave-requests", async (req, res, next) => {
  try {
    const { status, user_id, year } = req.query;

    let sql = `
      SELECT lr.*, u.full_name AS user_full_name, u.employee_code, u.department, u.role AS user_role, u.supervisor_id,
             u.email, u.email_2, u.phone,
             lt.name AS leave_type_name, lt.max_days AS leave_type_max_days,
             approver.full_name AS approver_name, la.comment
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN users approver ON lr.approved_by = approver.id
      ${latestLeaveApprovalJoin}
      WHERE 1=1`;
    const params = [];

    if (["lead", "assistant manager", "manager"].includes(req.user.role) && req.user.role !== "admin") {
      if (req.user.role === "manager") {
        sql += " AND u.department = ?";
        params.push(req.user.department);
      } else {
        sql += " AND (u.supervisor_id = ? OR lr.current_assignee_id = ?)";
        params.push(req.user.id, req.user.id);
      }
    }

    if (status) { sql += " AND lr.status = ?"; params.push(status); }
    if (user_id) { sql += " AND lr.user_id = ?"; params.push(user_id); }
    if (year) {
      const range = yearBounds(year);
      if (!range) return res.status(400).json({ message: "year ไม่ถูกต้อง" });
      sql += " AND lr.start_date >= ? AND lr.start_date < ?";
      params.push(...range);
    }
    sql += " ORDER BY lr.created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json(await attachLeaveFiles(rows.map(mapRow)));
  } catch (err) { next(err); }
});

// ── PATCH /api/admin/leave-requests/:id/approve ──────────────
router.patch("/leave-requests/:id/approve", csrfProtect, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    if (req.user.role === "hr") {
      return res.status(403).json({ message: "HR ไม่มีสิทธิ์อนุมัติคำขอลา" });
    }

    const { comment = null } = req.body;
    const requestId = req.params.id;
    const approverId = req.user.id;

    const [rows] = await conn.query(
      `SELECT lr.*, u.department AS user_dept, u.supervisor_id AS user_supervisor_id,
              u.full_name AS requester_full_name, u.employee_code AS requester_employee_code,
              u.email AS requester_email, u.email_2 AS requester_email_2,
              lt.name AS leave_type_name
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_types lt ON lt.id = lr.leave_type_id
       WHERE lr.id = ? LIMIT 1`,
      [requestId]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบคำขอลา" });
    if (!assertSameDept(req, res, rows[0].user_dept)) return;
    if (!(await assertWorkflowRights(req, res, rows[0]))) return;

    if (rows[0].status !== "pending") {
      return res.status(400).json({ message: "คำขอนี้ถูกดำเนินการไปแล้ว" });
    }

    const before = {
      status: rows[0].status,
      approved_by: rows[0].approved_by,
      approved_at: rows[0].approved_at,
      current_assignee_id: rows[0].current_assignee_id,
    };

    await conn.beginTransaction();
    const approval = await approveWorkflowRequest({
      conn,
      requestTable: "leave_requests",
      approvalTable: "leave_approvals",
      approvalRequestColumn: "leave_request_id",
      requestId,
      approver: req.user,
      comment,
      targetRow: rows[0],
      onFinalApprove: async () => {
        const year = new Date(rows[0].start_date).getFullYear();
        const leaveTypeId = rows[0].leave_type_id;

        await conn.query(
          `UPDATE user_leave_pool SET used_days = used_days + ? WHERE user_id = ? AND year = ?`,
          [rows[0].total_days, rows[0].user_id, year]
        );

        await conn.query(
          `INSERT INTO leave_balances (user_id, leave_type_id, total_days, used_days, year)
           SELECT ?, ?, max_days, ?, ? FROM leave_types WHERE id = ?
           ON DUPLICATE KEY UPDATE used_days = used_days + ?`,
          [rows[0].user_id, leaveTypeId, rows[0].total_days, year, leaveTypeId, rows[0].total_days]
        );
      },
    });
    await conn.commit();

    const nextAssigneeForResponse = approval.finalApproval ? null : await (async () => {
      const [updated] = await pool.query(
        "SELECT current_assignee_id FROM leave_requests WHERE id = ?",
        [requestId]
      );
      return updated[0]?.current_assignee_id ?? null;
    })();

    await logAudit({
      req,
      action: "leave.approve",
      targetType: "leave_request",
      targetId: Number(requestId),
      before,
      after: { status: approval.status, approved_by: approverId, approved_at: approval.now, comment: comment ?? null },
      note: comment ?? null,
      conn,
    });

    const [[approver]] = await pool.query(
      "SELECT full_name, employee_code, email, email_2 FROM users WHERE id = ? LIMIT 1",
      [approverId]
    );
    const requester = {
      full_name: rows[0].requester_full_name,
      employee_code: rows[0].requester_employee_code,
      email: rows[0].requester_email,
      email_2: rows[0].requester_email_2,
    };

    if (approval.finalApproval) {
      await notifyLeaveRequestResolved({
        leaveRequest: rows[0],
        requester,
        approver,
        status: "approved",
        comment,
      });
    } else if (nextAssigneeForResponse) {
      const [[assignee]] = await pool.query(
        "SELECT full_name, employee_code, email, email_2 FROM users WHERE id = ? LIMIT 1",
        [nextAssigneeForResponse]
      );
      await notifyLeaveRequestForwarded({
        leaveRequest: rows[0],
        requester,
        assignee,
        approver,
        comment,
      });
    }

    return res.json({
      message: approval.finalApproval ? "อนุมัติคำขอลาเรียบร้อย" : "รับทราบและส่งต่อคำขอเรียบร้อย",
      status: approval.status,
      current_assignee_id: nextAssigneeForResponse,
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally { conn.release(); }
});

// ── PATCH /api/admin/leave-requests/:id/reject ───────────────
router.patch("/leave-requests/:id/reject", csrfProtect, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    if (req.user.role === "hr") {
      return res.status(403).json({ message: "HR ไม่มีสิทธิ์ปฏิเสธคำขอลา" });
    }

    const { comment = null } = req.body;
    const requestId = req.params.id;
    const approverId = req.user.id;

    const [rows] = await conn.query(
      `SELECT lr.*, u.department AS user_dept, u.supervisor_id AS user_supervisor_id,
              u.full_name AS requester_full_name, u.employee_code AS requester_employee_code,
              u.email AS requester_email, u.email_2 AS requester_email_2,
              lt.name AS leave_type_name
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_types lt ON lt.id = lr.leave_type_id
       WHERE lr.id = ? LIMIT 1`,
      [requestId]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบคำขอลา" });
    if (!assertSameDept(req, res, rows[0].user_dept)) return;
    if (!(await assertWorkflowRights(req, res, rows[0]))) return;

    if (rows[0].status !== "pending") {
      return res.status(400).json({ message: "คำขอนี้ถูกดำเนินการไปแล้ว" });
    }

    const before = {
      status: rows[0].status,
      approved_by: rows[0].approved_by,
      approved_at: rows[0].approved_at,
      current_assignee_id: rows[0].current_assignee_id,
    };

    await conn.beginTransaction();
    const rejection = await rejectWorkflowRequest({
      conn,
      requestTable: "leave_requests",
      approvalTable: "leave_approvals",
      approvalRequestColumn: "leave_request_id",
      requestId,
      approver: req.user,
      comment,
      targetRow: rows[0],
    });
    await conn.commit();

    await logAudit({
      req,
      action: "leave.reject",
      targetType: "leave_request",
      targetId: Number(requestId),
      before,
      after: { status: "rejected", approved_by: approverId, approved_at: rejection.now, comment: comment ?? null },
      note: comment ?? null,
      conn,
    });

    const [[approver]] = await pool.query(
      "SELECT full_name, employee_code, email, email_2 FROM users WHERE id = ? LIMIT 1",
      [approverId]
    );
    await notifyLeaveRequestResolved({
      leaveRequest: rows[0],
      requester: {
        full_name: rows[0].requester_full_name,
        employee_code: rows[0].requester_employee_code,
        email: rows[0].requester_email,
        email_2: rows[0].requester_email_2,
      },
      approver,
      status: "rejected",
      comment,
    });

    return res.json({
      message: "ปฏิเสธคำขอลาเรียบร้อย",
      status: "rejected",
      current_assignee_id: null,
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally { conn.release(); }
});

// ── GET /api/admin/users ──────────────────────────────────────
router.get("/users", async (req, res, next) => {
  try {
    let sql = `SELECT id, employee_code, full_name, department, role, supervisor_id, email, email_2, phone, created_at FROM users`;
    const where = ["id != ?", "is_active = 1"];
    const params = [req.user.id];

    if (req.user.role === "lead") {
      where.push("role = 'user'");
    } else if (req.user.role === "assistant manager") {
      where.push("role = 'lead'");
    }
    // manager และ admin เห็นทุกคน ยกเว้นตัวเอง
    sql += ` WHERE ${where.join(" AND ")}`;
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
      return res.status(400).json({ message: "ไม่สามารถกำหนดตนเองเป็นทีมได้" });
    }

    const [target] = await pool.query(
      "SELECT id, full_name, role, supervisor_id FROM users WHERE id = ? AND is_active = 1 LIMIT 1",
      [userId]
    );
    if (!target[0]) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });

    let allowedSubRoles = [];
    if (callerRole === "lead") allowedSubRoles = ["user"];
    else if (callerRole === "assistant manager") allowedSubRoles = ["lead"];
    else allowedSubRoles = ["assistant manager", "lead", "user", "manager"];

    if (!allowedSubRoles.includes(target[0].role)) {
      return res.status(400).json({ message: `ไม่สามารถกำหนด role ${target[0].role} เป็นทีมได้` });
    }

    if (!assign && target[0].supervisor_id !== callerId && callerRole !== "admin") {
      return res.status(400).json({ message: "พนักงานนี้ไม่ใช่ทีมของคุณ" });
    }
    if (assign && target[0].supervisor_id !== null && target[0].supervisor_id !== callerId && callerRole !== "admin") {
      return res.status(409).json({ message: "พนักงานนี้มีหัวหน้าอยู่แล้ว กรุณาติดต่อ admin" });
    }

    const explicitSupervisor = req.body.supervisor_id;
    const newSupervisor = assign
      ? (callerRole === "admin" && explicitSupervisor !== undefined ? explicitSupervisor : callerId)
      : null;

    await pool.query("UPDATE users SET supervisor_id = ? WHERE id = ?", [newSupervisor, userId]);

    await logAudit({
      req,
      action: assign ? `${callerRole}.assign_subordinate` : `${callerRole}.unassign_subordinate`,
      targetType: "user",
      targetId: userId,
      after: { supervisor_id: newSupervisor, full_name: target[0].full_name },
      note: assign ? `กำหนด ${target[0].role} ${userId} เป็นทีม` : `ยกเลิก ${target[0].role} ${userId} จากทีม`,
    });

    res.json({ message: assign ? "กำหนดทีมเรียบร้อย" : "ยกเลิกทีมเรียบร้อย", user_id: userId, supervisor_id: newSupervisor });
  } catch (err) { next(err); }
});

// ── GET /api/admin/leave-pool/:user_id ───────────────────────
router.get("/leave-pool/:user_id", async (req, res, next) => {
  try {
    const year = req.query.year ?? new Date().getFullYear();
    const userId = req.params.user_id;
    const range = yearBounds(year);
    if (!range) return res.status(400).json({ message: "year ไม่ถูกต้อง" });

    const [uRows] = await pool.query("SELECT department FROM users WHERE id = ? AND is_active = 1 LIMIT 1", [userId]);
    if (!uRows[0]) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    if (!assertSameDept(req, res, uRows[0].department)) return;

    // 1. ดึง pool รวม
    const poolRowsPromise = pool.query(
      "SELECT * FROM user_leave_pool WHERE user_id = ? AND year = ? LIMIT 1",
      [userId, year]
    );
    
    // 2. ดึงแยกตามประเภท
    const balanceRowsPromise = pool.query(
      `SELECT lt.id AS leave_type_id, lt.name, lt.max_days AS default_max,
              lb.total_days, lb.used_days
       FROM leave_types lt
       LEFT JOIN leave_balances lb ON lb.leave_type_id = lt.id AND lb.user_id = ? AND lb.year = ?
       ORDER BY lt.id ASC`,
      [userId, year]
    );

    const approvedRowsPromise = pool.query(
      `SELECT lr.leave_type_id, lt.name, lr.start_time, lr.end_time, lr.total_days
       FROM leave_requests lr
       JOIN leave_types lt ON lt.id = lr.leave_type_id
       WHERE lr.user_id = ? AND lr.status = 'approved'
         AND lr.start_date >= ? AND lr.start_date < ?`,
      [userId, ...range]
    );
    const [[pRows], [bRows], [approvedRows]] = await Promise.all([
      poolRowsPromise,
      balanceRowsPromise,
      approvedRowsPromise,
    ]);
    const poolData = pRows[0] || { id: null, user_id: Number(userId), total_days: 0, used_days: 0, year: Number(year) };

    const usedByType = approvedRows.reduce((acc, row) => {
      const key = balanceKey(row.name, row.leave_type_id);
      acc[key] = (acc[key] ?? 0) + getLeaveDaysFromRow(row);
      return acc;
    }, {});

    const balanceMap = new Map();
    bRows.forEach((b) => {
      const key = balanceKey(b.name, b.leave_type_id);
      const totalDays = Number(b.total_days ?? b.default_max);
      const usedDays = Number(Number(usedByType[key] ?? b.used_days ?? 0).toFixed(2));
      const existing = balanceMap.get(key);

      if (!existing) {
        balanceMap.set(key, {
          leave_type_id: b.leave_type_id,
          name: b.name,
          total_days: totalDays,
          used_days: usedDays,
        });
        return;
      }

      existing.leave_type_id = Math.min(existing.leave_type_id, b.leave_type_id);
      existing.total_days = Math.max(existing.total_days, totalDays);
      existing.used_days = usedByType[key] != null
        ? existing.used_days
        : Number((existing.used_days + usedDays).toFixed(2));
    });
    const balances = Array.from(balanceMap.values())
      .map((balance) => ({
        ...balance,
        remaining: Math.max(0, Number((balance.total_days - balance.used_days).toFixed(2))),
      }))
      .sort((a, b) => a.leave_type_id - b.leave_type_id);

    const totalUsedDays = Number(balances.reduce((sum, balance) => sum + balance.used_days, 0).toFixed(2));

    res.json({
      ...poolData,
      used_days: totalUsedDays,
      remaining: Math.max(0, poolData.total_days - totalUsedDays),
      balances
    });
  } catch (err) { next(err); }
});

// ── PATCH /api/admin/leave-pool/:user_id ─────────────────────
router.patch("/leave-pool/:user_id", csrfProtect, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { balances, year } = req.body; // balances: [{ leave_type_id, total_days }]
    const userId = req.params.user_id;

    if (!balances || !Array.isArray(balances) || balances.length === 0 || !year) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    const [uRows] = await conn.query("SELECT department FROM users WHERE id = ? AND is_active = 1 LIMIT 1", [userId]);
    if (!uRows[0]) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    if (!assertSameDept(req, res, uRows[0].department)) return;

    await conn.beginTransaction();

    let totalGlobalDays = 0;
    let totalGlobalUsed = 0;

    const leaveTypeIds = balances.map((b) => Number(b.leave_type_id));
    const [existingRows] = await conn.query(
      `SELECT leave_type_id, used_days
       FROM leave_balances
       WHERE user_id = ? AND year = ? AND leave_type_id IN (?)`,
      [userId, year, leaveTypeIds]
    );
    const usedByType = new Map(existingRows.map((row) => [Number(row.leave_type_id), Number(row.used_days ?? 0)]));
    const balanceValues = balances.map((b) => {
      const leaveTypeId = Number(b.leave_type_id);
      const totalDays = Number(b.total_days);
      const used = usedByType.get(leaveTypeId) ?? 0;
      totalGlobalDays += totalDays;
      totalGlobalUsed += used;
      return [userId, leaveTypeId, totalDays, used, year];
    });

    await conn.query(
      `INSERT INTO leave_balances (user_id, leave_type_id, total_days, used_days, year)
       VALUES ?
       ON DUPLICATE KEY UPDATE total_days = VALUES(total_days)`,
      [balanceValues]
    );

    // อัปเดต user_leave_pool ให้ตรงกัน (Optional: ถ้าอยากให้ pool รวมสะท้อนยอดรวมทั้งหมด)
    await conn.query(
      `INSERT INTO user_leave_pool (user_id, total_days, used_days, year)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE total_days = ?`,
      [userId, totalGlobalDays, totalGlobalUsed, year, totalGlobalDays]
    );

    await conn.commit();

    await logAudit({
      req, action: "balance.update_multiple", targetType: "leave_balance", targetId: Number(userId),
      after: { balances, totalGlobalDays }, note: `แก้ไขวันลาแยกประเภท ปี ${year}`,
    });

    // ดึงข้อมูลกลับไปส่ง response
    const [pRows] = await pool.query(
      "SELECT * FROM user_leave_pool WHERE user_id = ? AND year = ? LIMIT 1",
      [userId, year]
    );
    const [bRows] = await pool.query(
      `SELECT lt.id AS leave_type_id, lt.name, lb.total_days, lb.used_days
       FROM leave_types lt
       LEFT JOIN leave_balances lb ON lb.leave_type_id = lt.id AND lb.user_id = ? AND lb.year = ?
       ORDER BY lt.id ASC`,
      [userId, year]
    );
    const updatedBalanceMap = new Map();
    bRows.forEach((b) => {
      const key = balanceKey(b.name, b.leave_type_id);
      const totalDays = Number(b.total_days ?? 0);
      const usedDays = Number(b.used_days ?? 0);
      const existing = updatedBalanceMap.get(key);
      if (!existing) {
        updatedBalanceMap.set(key, {
          leave_type_id: b.leave_type_id,
          name: b.name,
          total_days: totalDays,
          used_days: usedDays,
        });
        return;
      }
      existing.leave_type_id = Math.min(existing.leave_type_id, b.leave_type_id);
      existing.total_days = Math.max(existing.total_days, totalDays);
      existing.used_days = Number((existing.used_days + usedDays).toFixed(2));
    });
    const updatedBalances = Array.from(updatedBalanceMap.values())
      .map((balance) => ({
        ...balance,
        remaining: Math.max(0, Number((balance.total_days - balance.used_days).toFixed(2))),
      }))
      .sort((a, b) => a.leave_type_id - b.leave_type_id);

    res.json({
      ...pRows[0],
      remaining: Math.max(0, pRows[0].total_days - pRows[0].used_days),
      balances: updatedBalances
    });
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

    if (["lead", "assistant manager", "manager"].includes(req.user.role) && req.user.role !== "admin") {
      if (req.user.role === "manager") {
        sql += " AND u.department = ?";
        params.push(req.user.department);
      } else {
        sql += " AND (u.supervisor_id = ? OR ot.current_assignee_id = ?)";
        params.push(req.user.id, req.user.id);
      }
    }

    if (status) { sql += " AND ot.status = ?"; params.push(status); }
    if (user_id) { sql += " AND ot.user_id = ?"; params.push(user_id); }
    if (year) {
      const range = yearBounds(year);
      if (!range) return res.status(400).json({ message: "year ไม่ถูกต้อง" });
      sql += " AND ot.ot_date >= ? AND ot.ot_date < ?";
      params.push(...range);
    }
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

// ── PATCH /api/admin/ot-requests/:id/approve ─────────────────
router.patch("/ot-requests/:id/approve", csrfProtect, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { comment = null } = req.body;
    const requestId = req.params.id;
    const approverId = req.user.id;

    const [rows] = await conn.query(
      `SELECT ot.*, u.department AS user_dept
       FROM ot_requests ot
       JOIN users u ON ot.user_id = u.id
       WHERE ot.id = ? LIMIT 1`,
      [requestId]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบคำขอ OT" });
    if (!assertSameDept(req, res, rows[0].user_dept)) return;
    if (!(await assertWorkflowRights(req, res, rows[0]))) return;

    if (rows[0].status !== "pending") {
      return res.status(400).json({ message: "คำขอนี้ถูกดำเนินการไปแล้ว" });
    }

    const before = {
      status: rows[0].status,
      approved_by: rows[0].approved_by,
      approved_at: rows[0].approved_at,
      current_assignee_id: rows[0].current_assignee_id,
    };

    await conn.beginTransaction();
    const approval = await approveWorkflowRequest({
      conn,
      requestTable: "ot_requests",
      approvalTable: "ot_approvals",
      approvalRequestColumn: "ot_request_id",
      requestId,
      approver: req.user,
      comment,
      targetRow: rows[0],
    });
    await conn.commit();

    const nextAssigneeForResponse = approval.finalApproval ? null : await (async () => {
      const [updated] = await pool.query(
        "SELECT current_assignee_id FROM ot_requests WHERE id = ?",
        [requestId]
      );
      return updated[0]?.current_assignee_id ?? null;
    })();

    await logAudit({
      req,
      action: "ot.approve",
      targetType: "ot_request",
      targetId: Number(requestId),
      before,
      after: { status: approval.status, approved_by: approverId, approved_at: approval.now, comment: comment ?? null },
      note: comment ?? null,
      conn,
    });

    return res.json({
      message: approval.finalApproval ? "อนุมัติคำขอ OT เรียบร้อย" : "รับทราบและส่งต่อคำขอเรียบร้อย",
      status: approval.status,
      current_assignee_id: nextAssigneeForResponse,
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally { conn.release(); }
});

// ── PATCH /api/admin/ot-requests/:id/reject ──────────────────
router.patch("/ot-requests/:id/reject", csrfProtect, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { comment = null } = req.body;
    const requestId = req.params.id;
    const approverId = req.user.id;

    const [rows] = await conn.query(
      `SELECT ot.*, u.department AS user_dept
       FROM ot_requests ot
       JOIN users u ON ot.user_id = u.id
       WHERE ot.id = ? LIMIT 1`,
      [requestId]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบคำขอ OT" });
    if (!assertSameDept(req, res, rows[0].user_dept)) return;
    if (!(await assertWorkflowRights(req, res, rows[0]))) return;

    if (rows[0].status !== "pending") {
      return res.status(400).json({ message: "คำขอนี้ถูกดำเนินการไปแล้ว" });
    }

    const before = {
      status: rows[0].status,
      approved_by: rows[0].approved_by,
      approved_at: rows[0].approved_at,
      current_assignee_id: rows[0].current_assignee_id,
    };

    await conn.beginTransaction();
    const rejection = await rejectWorkflowRequest({
      conn,
      requestTable: "ot_requests",
      approvalTable: "ot_approvals",
      approvalRequestColumn: "ot_request_id",
      requestId,
      approver: req.user,
      comment,
      targetRow: rows[0],
    });
    await conn.commit();

    await logAudit({
      req,
      action: "ot.reject",
      targetType: "ot_request",
      targetId: Number(requestId),
      before,
      after: { status: "rejected", approved_by: approverId, approved_at: rejection.now, comment: comment ?? null },
      note: comment ?? null,
      conn,
    });

    return res.json({
      message: "ปฏิเสธคำขอ OT เรียบร้อย",
      status: "rejected",
      current_assignee_id: null,
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally { conn.release(); }
});

// ── GET /api/admin/reports/dashboard-stats ────────────────────
router.get("/reports/dashboard-stats", async (req, res, next) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "manager" && req.user.role !== "hr") {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงรายงาน" });
    }

    const currentYear = new Date().getFullYear();
    const currentYearRange = yearBounds(currentYear);

    const [
      [[{ total_users }]],
      [[{ pending_leaves }]],
      [[otRow]],
      [approvedLeaveRows],
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total_users FROM users WHERE is_active = 1"),
      pool.query("SELECT COUNT(*) AS pending_leaves FROM leave_requests WHERE status = 'pending'"),
      pool.query(
        "SELECT COUNT(*) AS pending_ots FROM ot_requests WHERE status = 'pending'"
      ).catch(() => [[{ pending_ots: 0 }]]),
      pool.query(
        `SELECT start_time, end_time, total_days
         FROM leave_requests
         WHERE status = 'approved' AND start_date >= ? AND start_date < ?`,
        currentYearRange
      ),
    ]);
    const pending_ots = otRow.pending_ots;
    const total_approved_leave_days = Number(
      approvedLeaveRows.reduce((sum, row) => sum + getLeaveDaysFromRow(row), 0).toFixed(2)
    );

    const deptRowsPromise = pool.query(
      `SELECT u.department AS name, COUNT(*) AS value
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       WHERE lr.start_date >= ? AND lr.start_date < ?
       GROUP BY u.department
       ORDER BY value DESC`,
      currentYearRange
    );

    const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const monthRowsPromise = pool.query(
      `SELECT MONTH(start_date) AS m, COUNT(*) AS cnt
       FROM leave_requests
       WHERE start_date >= ? AND start_date < ?
       GROUP BY MONTH(start_date)
       ORDER BY m`,
      currentYearRange
    );
    const leaveTypeRowsPromise = pool.query(
      `SELECT u.department, lt.name AS leave_type, lr.start_time, lr.end_time, lr.total_days
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.status = 'approved' AND lr.start_date >= ? AND lr.start_date < ?
       ORDER BY u.department ASC`,
      currentYearRange
    );
    const [[deptRows], [monthRows]] = await Promise.all([deptRowsPromise, monthRowsPromise]);
    const monthMap = {};
    monthRows.forEach(r => { monthMap[r.m] = r.cnt; });
    const monthlyStats = monthNames.map((name, i) => ({
      name,
      "จำนวนครั้งที่ลา": monthMap[i + 1] || 0,
    }));

    const [leaveTypeRowsRaw] = await leaveTypeRowsPromise;
    const leaveTypeStatsMap = leaveTypeRowsRaw.reduce((acc, row) => {
      const key = `${row.department}::${row.leave_type}`;
      if (!acc[key]) acc[key] = { department: row.department, leave_type: row.leave_type, total_leave_days: 0 };
      acc[key].total_leave_days += getLeaveDaysFromRow(row);
      return acc;
    }, {});
    const leaveTypeRows = Object.values(leaveTypeStatsMap).map((row) => ({
      ...row,
      total_leave_days: Number(row.total_leave_days.toFixed(2)),
    }));

    res.json({
      summary: { total_users, pending_leaves, pending_ots, total_approved_leave_days },
      deptStats: deptRows,
      monthlyStats,
      leaveTypeStats: leaveTypeRows,
    });
  } catch (err) { next(err); }
});

// ── GET /api/admin/reports/leave-summary ─────────────────────
router.get("/reports/leave-summary", async (req, res, next) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "manager" && req.user.role !== "hr") {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงรายงาน" });
    }

    const currentYearRange = yearBounds(new Date().getFullYear());
    const sql = `
      SELECT u.department, lt.name AS leave_type, lr.start_time, lr.end_time, lr.total_days
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE lr.status = 'approved' AND lr.start_date >= ? AND lr.start_date < ?
      ORDER BY u.department ASC
    `;
    const [rows] = await pool.query(sql, currentYearRange);
    const summaryMap = rows.reduce((acc, row) => {
      const key = `${row.department}::${row.leave_type}`;
      if (!acc[key]) acc[key] = { department: row.department, leave_type: row.leave_type, total_leave_days: 0 };
      acc[key].total_leave_days += getLeaveDaysFromRow(row);
      return acc;
    }, {});
    res.json(Object.values(summaryMap).map((row) => ({
      ...row,
      total_leave_days: Number(row.total_leave_days.toFixed(2)),
    })));
  } catch (err) { next(err); }
});

// ── GET /api/admin/departments ────────────────────────────────
router.get("/departments", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM departments ORDER BY name ASC");
    res.json(rows);
  } catch (err) { next(err); }
});

// ── POST /api/admin/departments ───────────────────────────────
router.post("/departments", csrfProtect, async (req, res, next) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "manager") {
      return res.status(403).json({ message: "ไม่มีสิทธิ์ใช้งาน" });
    }
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "กรุณาระบุชื่อแผนก" });

    await pool.query("INSERT INTO departments (name) VALUES (?)", [name]);
    res.json({ message: "เพิ่มแผนกเรียบร้อย" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "ชื่อแผนกนี้มีอยู่แล้ว" });
    }
    next(err);
  }
});

// ── PUT /api/admin/departments/:id ────────────────────────────
router.put("/departments/:id", csrfProtect, async (req, res, next) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "manager") {
      return res.status(403).json({ message: "ไม่มีสิทธิ์ใช้งาน" });
    }
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "กรุณาระบุชื่อแผนก" });

    await pool.query("UPDATE departments SET name = ? WHERE id = ?", [name, req.params.id]);
    res.json({ message: "แก้ไขแผนกเรียบร้อย" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "ชื่อแผนกนี้มีอยู่แล้ว" });
    }
    next(err);
  }
});

// ── DELETE /api/admin/departments/:id ─────────────────────────
router.delete("/departments/:id", csrfProtect, async (req, res, next) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "manager") {
      return res.status(403).json({ message: "ไม่มีสิทธิ์ใช้งาน" });
    }

    const [dept] = await pool.query("SELECT name FROM departments WHERE id = ?", [req.params.id]);
    if (!dept[0]) return res.status(404).json({ message: "ไม่พบแผนก" });

    const [users] = await pool.query("SELECT id FROM users WHERE department = ? AND is_active = 1 LIMIT 1", [dept[0].name]);
    if (users.length > 0) {
      return res.status(400).json({ message: "ไม่สามารถลบแผนกที่มีพนักงานสังกัดอยู่ได้" });
    }

    await pool.query("DELETE FROM departments WHERE id = ?", [req.params.id]);
    res.json({ message: "ลบแผนกเรียบร้อย" });
  } catch (err) { next(err); }
});

export default router;

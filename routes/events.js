import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import pool from "../config/db.js";
import { authenticate, csrfProtect } from "../middleware/auth.js";
import { logAudit } from "../middleware/audit.js";
import { eventEvidenceDir, normalizeOriginalName, uploadEventEvidence } from "../middleware/upload.js";

const router = Router();
router.use(authenticate);

const EVENT_COLUMNS = `
  e.id, e.title, e.description, e.start_date, e.end_date, e.created_by, e.lead_id,
  e.department, e.created_at,
  creator.full_name AS creator_name, creator.role AS creator_role,
  lead_user.full_name AS lead_name, lead_user.employee_code AS lead_employee_code
`;

function canCreateEvent(user) {
  return ["manager", "assistant manager", "admin"].includes(user?.role);
}

function canViewAllDepartmentEvents(user) {
  return ["manager", "admin"].includes(user?.role);
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""));
}

function toIsoDate(value) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

function eventDates(startDate, endDate) {
  const dates = [];
  const current = new Date(`${toIsoDate(startDate)}T00:00:00Z`);
  const end = new Date(`${toIsoDate(endDate)}T00:00:00Z`);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function isDateInsideEvent(date, event) {
  const eventDate = toIsoDate(date);
  return isValidDate(eventDate) && eventDate >= toIsoDate(event.start_date) && eventDate <= toIsoDate(event.end_date);
}

async function mapEvents(rows) {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const [leads] = await pool.query(
    `SELECT el.event_id,
            u.id, u.employee_code, u.full_name, u.department, u.role, u.supervisor_id
     FROM event_leads el
     JOIN users u ON u.id = el.lead_id
     WHERE el.event_id IN (?)
     ORDER BY u.full_name ASC`,
    [ids]
  );
  const [participants] = await pool.query(
    `SELECT ep.event_id, ep.selected_by_lead_id, ep.selected_at,
            u.id, u.employee_code, u.full_name, u.department, u.role, u.supervisor_id,
            selected_lead.full_name AS selected_by_lead_name
     FROM event_participants ep
     JOIN users u ON u.id = ep.user_id
     LEFT JOIN users selected_lead ON selected_lead.id = ep.selected_by_lead_id
     WHERE ep.event_id IN (?)
     ORDER BY u.full_name ASC`,
    [ids]
  );
  const leadsByEvent = new Map();
  leads.forEach((lead) => {
    const item = {
      id: lead.id,
      employee_code: lead.employee_code,
      full_name: lead.full_name,
      department: lead.department,
      role: lead.role,
      supervisor_id: lead.supervisor_id,
    };
    leadsByEvent.set(lead.event_id, [...(leadsByEvent.get(lead.event_id) ?? []), item]);
  });
  const byEvent = new Map();
  participants.forEach((participant) => {
    const item = {
      id: participant.id,
      employee_code: participant.employee_code,
      full_name: participant.full_name,
      department: participant.department,
      role: participant.role,
      supervisor_id: participant.supervisor_id,
      selected_by_lead_id: participant.selected_by_lead_id,
      selected_by_lead_name: participant.selected_by_lead_name,
      selected_at: participant.selected_at,
    };
    byEvent.set(participant.event_id, [...(byEvent.get(participant.event_id) ?? []), item]);
  });
  return rows.map((row) => {
    const eventLeads = leadsByEvent.get(row.id) ?? [];
    return {
      ...row,
      leads: eventLeads,
      lead_ids: eventLeads.map((lead) => lead.id),
      lead_name: eventLeads.length ? eventLeads.map((lead) => lead.full_name).join(", ") : row.lead_name,
      participants: byEvent.get(row.id) ?? [],
    };
  });
}

async function mapMyEvents(rows, userId) {
  const events = await mapEvents(rows);
  if (!events.length) return [];
  const [logs] = await pool.query(
    `SELECT event_id, event_date, check_in_time, check_out_time, check_in_at, check_out_at, status, approved_by, approved_at, approval_comment
     FROM event_time_logs
     WHERE user_id = ? AND event_id IN (?)`,
    [userId, events.map((event) => event.id)]
  );
  const logByEventDate = new Map(logs.map((log) => [`${log.event_id}:${toIsoDate(log.event_date)}`, log]));
  return events.map((event) => ({
    ...event,
    attendance_days: eventDates(event.start_date, event.end_date).map((eventDate) => {
      const log = logByEventDate.get(`${event.id}:${eventDate}`);
      return log ?? { event_id: event.id, event_date: eventDate, check_in_at: null, check_out_at: null };
    }),
  }));
}

function evidenceUrl(id) {
  return `/api/events/evidence/${id}`;
}

async function getEventForUser(eventId, user, conn = pool) {
  const params = [eventId];
  let sql = `
    SELECT ${EVENT_COLUMNS}
    FROM events e
    JOIN users creator ON creator.id = e.created_by
    JOIN users lead_user ON lead_user.id = e.lead_id
    WHERE e.id = ?`;

  if (user.role === "assistant manager") {
    sql += ` AND (e.created_by = ? OR EXISTS (
      SELECT 1 FROM event_leads el
      JOIN users lu ON lu.id = el.lead_id
      WHERE el.event_id = e.id AND lu.supervisor_id = ?
    ))`;
    params.push(user.id, user.id);
  } else if (user.role === "lead") {
    sql += " AND EXISTS (SELECT 1 FROM event_leads el WHERE el.event_id = e.id AND el.lead_id = ?)";
    params.push(user.id);
  } else if (!canViewAllDepartmentEvents(user)) {
    sql += " AND e.created_by = ?";
    params.push(user.id);
  } else if (user.role === "manager") {
    sql += " AND (e.department = ? OR e.department IS NULL)";
    params.push(user.department);
  }

  const [rows] = await conn.query(sql, params);
  return rows[0] ?? null;
}

router.get("/", async (req, res, next) => {
  try {
    const params = [];
    let sql = `
      SELECT ${EVENT_COLUMNS}
      FROM events e
      JOIN users creator ON creator.id = e.created_by
      JOIN users lead_user ON lead_user.id = e.lead_id
      WHERE 1=1`;

    if (req.user.role === "manager") {
      sql += " AND (e.department = ? OR e.department IS NULL)";
      params.push(req.user.department);
    } else if (req.user.role === "assistant manager") {
      sql += ` AND (e.created_by = ? OR EXISTS (
        SELECT 1 FROM event_leads el
        JOIN users lu ON lu.id = el.lead_id
        WHERE el.event_id = e.id AND lu.supervisor_id = ?
      ))`;
      params.push(req.user.id, req.user.id);
    } else if (req.user.role === "lead") {
      sql += " AND EXISTS (SELECT 1 FROM event_leads el WHERE el.event_id = e.id AND el.lead_id = ?)";
      params.push(req.user.id);
    } else if (req.user.role !== "admin") {
      sql += " AND e.created_by = ?";
      params.push(req.user.id);
    }

    sql += " ORDER BY e.start_date DESC, e.id DESC";
    const [rows] = await pool.query(sql, params);
    res.json(await mapEvents(rows));
  } catch (err) {
    next(err);
  }
});

router.get("/my", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${EVENT_COLUMNS}
       FROM events e
       JOIN users creator ON creator.id = e.created_by
       JOIN users lead_user ON lead_user.id = e.lead_id
       WHERE EXISTS (
         SELECT 1 FROM event_participants ep
         WHERE ep.event_id = e.id AND ep.user_id = ?
       )
       OR EXISTS (
         SELECT 1 FROM event_leads el
         WHERE el.event_id = e.id AND el.lead_id = ?
       )
       ORDER BY e.start_date DESC, e.id DESC`,
      [req.user.id, req.user.id]
    );
    res.json(await mapMyEvents(rows, req.user.id));
  } catch (err) {
    next(err);
  }
});

router.get("/evidence/:attachmentId", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT eta.*, etl.user_id, etl.event_id, e.department, ep.user_id AS participant_id,
              EXISTS (
                SELECT 1 FROM event_leads lead_scope
                WHERE lead_scope.event_id = etl.event_id AND lead_scope.lead_id = ?
              ) AS is_event_lead,
              EXISTS (
                SELECT 1
                FROM event_leads assistant_scope
                JOIN users event_lead ON event_lead.id = assistant_scope.lead_id
                WHERE assistant_scope.event_id = etl.event_id AND event_lead.supervisor_id = ?
              ) AS is_assistant_scope
       FROM event_time_attachments eta
       JOIN event_time_logs etl ON etl.id = eta.event_time_log_id
       JOIN events e ON e.id = etl.event_id
       LEFT JOIN event_participants ep ON ep.event_id = etl.event_id AND ep.user_id = etl.user_id
       WHERE eta.id = ?
       LIMIT 1`,
      [req.user.id, req.user.id, req.params.attachmentId]
    );
    const file = rows[0];
    if (!file) return res.status(404).json({ message: "ไม่พบไฟล์" });
    const allowed =
      file.user_id === req.user.id ||
      req.user.role === "admin" ||
      (req.user.role === "manager" && file.department === req.user.department) ||
      (req.user.role === "lead" && file.is_event_lead) ||
      (req.user.role === "assistant manager" && file.is_assistant_scope);
    if (!allowed) return res.status(403).json({ message: "ไม่มีสิทธิ์เปิดไฟล์นี้" });
    res.setHeader("Content-Type", file.mime_type);
    res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(file.original_name)}`);
    res.sendFile(path.resolve(eventEvidenceDir, file.stored_name));
  } catch (err) {
    next(err);
  }
});

router.get("/leads", async (req, res, next) => {
  try {
    if (!canCreateEvent(req.user)) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เลือก Lead สำหรับ Event" });
    }

    const params = [];
    const where = ["role = 'lead'", "is_active = 1"];
    if (req.user.role === "manager") {
      where.push("department = ?");
      params.push(req.user.department);
    } else if (req.user.role === "assistant manager") {
      where.push("supervisor_id = ?");
      params.push(req.user.id);
    }

    const [rows] = await pool.query(
      `SELECT id, employee_code, full_name, department, role, supervisor_id, email, email_2, phone
       FROM users
       WHERE ${where.join(" AND ")}
       ORDER BY full_name ASC`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post("/", csrfProtect, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    if (!canCreateEvent(req.user)) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์สร้าง Event" });
    }

    const title = cleanString(req.body.title);
    const description = cleanString(req.body.description) || null;
    const { start_date, end_date } = req.body;
    const leadIds = Array.isArray(req.body.lead_ids)
      ? Array.from(new Set(req.body.lead_ids.map(Number))).filter((id) => Number.isInteger(id) && id > 0)
      : [Number(req.body.lead_id)].filter((id) => Number.isInteger(id) && id > 0);
    const primaryLeadId = leadIds[0];

    if (!title) return res.status(400).json({ message: "กรุณาระบุชื่อ Event" });
    if (!isValidDate(start_date) || !isValidDate(end_date)) {
      return res.status(400).json({ message: "รูปแบบวันที่ไม่ถูกต้อง" });
    }
    if (String(end_date) < String(start_date)) {
      return res.status(400).json({ message: "วันที่สิ้นสุดต้องไม่น้อยกว่าวันเริ่มต้น" });
    }
    if (!leadIds.length) {
      return res.status(400).json({ message: "กรุณาเลือก Lead อย่างน้อย 1 คน" });
    }

    const [leadRows] = await conn.query(
      `SELECT id, full_name, employee_code, department, role, supervisor_id
       FROM users
       WHERE id IN (?) AND role = 'lead' AND is_active = 1`,
      [leadIds]
    );
    if (leadRows.length !== leadIds.length) return res.status(404).json({ message: "ไม่พบ Lead บางคน" });
    if (req.user.role === "manager" && leadRows.some((lead) => lead.department !== req.user.department)) {
      return res.status(403).json({ message: "เลือก Lead ได้เฉพาะในแผนกของคุณ" });
    }
    if (req.user.role === "assistant manager" && leadRows.some((lead) => lead.supervisor_id !== req.user.id)) {
      return res.status(403).json({ message: "รอง Manager เลือกได้เฉพาะ Lead ในทีมของตัวเอง" });
    }

    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO events (title, description, start_date, end_date, created_by, lead_id, department)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, start_date, end_date, req.user.id, primaryLeadId, leadRows[0].department ?? req.user.department ?? null]
    );
    const eventId = result.insertId;
    await conn.query(
      `INSERT INTO event_leads (event_id, lead_id)
       VALUES ${leadIds.map(() => "(?, ?)").join(", ")}`,
      leadIds.flatMap((leadId) => [eventId, leadId])
    );
    await logAudit({
      req,
      action: "event.create",
      targetType: "event",
      targetId: eventId,
      after: { title, description, start_date, end_date, lead_ids: leadIds },
      conn,
    });
    await conn.commit();

    const row = await getEventForUser(eventId, req.user);
    res.status(201).json((await mapEvents([row]))[0]);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

router.get("/:id/team", async (req, res, next) => {
  try {
    const event = await getEventForUser(req.params.id, req.user);
    if (!event) return res.status(404).json({ message: "ไม่พบ Event" });

    if (req.user.role === "lead") {
      const [rows] = await pool.query(
        `SELECT u.id, u.employee_code, u.full_name, u.department, u.role, u.supervisor_id,
                u.email, u.email_2, u.phone,
                event_lead.id AS lead_id, event_lead.full_name AS lead_name
         FROM event_leads el
         JOIN users event_lead ON event_lead.id = el.lead_id
         JOIN users u ON u.supervisor_id = el.lead_id
         WHERE el.event_id = ? AND el.lead_id = ? AND u.role = 'user' AND u.is_active = 1
         ORDER BY u.id ASC`,
        [event.id, req.user.id]
      );
      return res.json(rows);
    }

    const teamWhere = ["is_active = 1", "role <> 'admin'"];
    const teamParams = [];
    if (req.user.role !== "admin") {
      teamWhere.push("department = ?");
      teamParams.push(req.user.department);
    }

    const [rows] = await pool.query(
      `SELECT id, employee_code, full_name, department, role, supervisor_id, email, email_2, phone
       FROM users
       WHERE ${teamWhere.join(" AND ")}
       ORDER BY id ASC`,
      teamParams
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/:id/attendance", async (req, res, next) => {
  try {
    const event = await getEventForUser(req.params.id, req.user);
    if (!event) return res.status(404).json({ message: "ไม่พบ Event" });
    const params = [event.id];
    let scope = "";
    if (req.user.role === "lead") {
      scope = " AND (u.supervisor_id = ? OR u.id = ?)";
      params.push(req.user.id, req.user.id);
    } else if (req.user.role === "assistant manager") {
      scope = " AND EXISTS (SELECT 1 FROM event_leads el JOIN users lu ON lu.id = el.lead_id WHERE el.event_id = etl.event_id AND lu.supervisor_id = ?)";
      params.push(req.user.id);
    }
    const [logs] = await pool.query(
      `SELECT etl.*, u.full_name, u.employee_code, u.department, approver.full_name AS approver_name
       FROM event_time_logs etl
       JOIN users u ON u.id = etl.user_id
       LEFT JOIN users approver ON approver.id = etl.approved_by
       WHERE etl.event_id = ? ${scope}
       ORDER BY etl.event_date ASC, u.full_name ASC`,
      params
    );
    if (!logs.length) return res.json([]);
    const [files] = await pool.query(
      `SELECT id, event_time_log_id, evidence_type, original_name, mime_type, size
       FROM event_time_attachments
       WHERE event_time_log_id IN (?)
       ORDER BY id ASC`,
      [logs.map((log) => log.id)]
    );
    const filesByLog = new Map();
    files.forEach((file) => {
      filesByLog.set(file.event_time_log_id, [...(filesByLog.get(file.event_time_log_id) ?? []), { ...file, url: evidenceUrl(file.id) }]);
    });
    res.json(logs.map((log) => ({ ...log, attachments: filesByLog.get(log.id) ?? [] })));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/participants", csrfProtect, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const event = await getEventForUser(req.params.id, req.user, conn);
    if (!event) return res.status(404).json({ message: "ไม่พบ Event" });
    if (!["manager", "assistant manager", "admin", "lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เลือกสมาชิก Event" });
    }
    if (req.user.role === "lead" && event.lead_id !== req.user.id) {
      const [leadRows] = await conn.query(
        "SELECT id FROM event_leads WHERE event_id = ? AND lead_id = ? LIMIT 1",
        [event.id, req.user.id]
      );
      if (!leadRows[0]) {
        return res.status(403).json({ message: "Lead เลือกสมาชิกได้เฉพาะ Event ของตัวเอง" });
      }
    }

    const participantIds = Array.isArray(req.body.participant_ids)
      ? Array.from(new Set(req.body.participant_ids.map(Number))).filter((id) => Number.isInteger(id) && id > 0)
      : [];

    if (participantIds.length) {
      const participantWhere = ["id IN (?)", "is_active = 1"];
      const participantParams = [participantIds];
      if (req.user.role === "lead") {
        participantWhere.push("supervisor_id = ?");
        participantParams.push(req.user.id);
      } else {
        participantWhere.push("role <> 'admin'");
        if (req.user.role !== "admin") {
          participantWhere.push("department = ?");
          participantParams.push(req.user.department);
        }
      }
      const [validUsers] = await conn.query(
        `SELECT id FROM users
         WHERE ${participantWhere.join(" AND ")}`,
        participantParams
      );
      if (validUsers.length !== participantIds.length) {
        return res.status(400).json({ message: "สมาชิกบางคนไม่มีสิทธิ์เลือกเข้า Event นี้" });
      }
    }

    const [beforeRows] = await conn.query(
      "SELECT user_id FROM event_participants WHERE event_id = ? ORDER BY user_id ASC",
      [event.id]
    );

    await conn.beginTransaction();
    if (req.user.role === "lead") {
      await conn.query(
        `DELETE ep FROM event_participants ep
         JOIN users u ON u.id = ep.user_id
         WHERE ep.event_id = ? AND u.supervisor_id = ?`,
        [event.id, req.user.id]
      );
    } else {
      await conn.query("DELETE FROM event_participants WHERE event_id = ?", [event.id]);
    }
    if (participantIds.length) {
      await conn.query(
        `INSERT INTO event_participants (event_id, user_id, selected_by_lead_id)
         SELECT ?, u.id, u.supervisor_id
         FROM users u
         WHERE u.id IN (?)`,
        [event.id, participantIds]
      );
    }
    await logAudit({
      req,
      action: "event.participants_update",
      targetType: "event",
      targetId: event.id,
      before: { participant_ids: beforeRows.map((row) => row.user_id) },
      after: { participant_ids: participantIds },
      conn,
    });
    await conn.commit();

    const row = await getEventForUser(event.id, req.user);
    res.json((await mapEvents([row]))[0]);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

async function assertEventAttendee(eventId, userId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT e.id, e.start_date, e.end_date
     FROM events e
     WHERE e.id = ?
       AND (
         EXISTS (
           SELECT 1 FROM event_participants ep
           WHERE ep.event_id = e.id AND ep.user_id = ?
         )
         OR EXISTS (
           SELECT 1 FROM event_leads el
           WHERE el.event_id = e.id AND el.lead_id = ?
         )
       )
     LIMIT 1`,
    [eventId, userId, userId]
  );
  return rows[0] ?? null;
}

router.post("/:id/attendance", csrfProtect, uploadEventEvidence.fields([
  { name: "check_in_evidence", maxCount: 1 },
  { name: "check_out_evidence", maxCount: 1 },
]), async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const eventId = Number(req.params.id);
    const eventDate = String(req.body.event_date ?? "").slice(0, 10);
    const checkInTime = String(req.body.check_in_time ?? "").slice(0, 5);
    const checkOutTime = String(req.body.check_out_time ?? "").slice(0, 5);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ message: "Event ไม่ถูกต้อง" });
    }
    const event = await assertEventAttendee(eventId, req.user.id, conn);
    if (!event) return res.status(403).json({ message: "คุณไม่ได้อยู่ในรายชื่อผู้เข้าร่วม/Lead ของ Event นี้" });
    if (!isDateInsideEvent(eventDate, event)) {
      return res.status(400).json({ message: "วันที่ลงเวลาไม่อยู่ในช่วง Event" });
    }
    if (!/^\d{2}:\d{2}$/.test(checkInTime) || !/^\d{2}:\d{2}$/.test(checkOutTime)) {
      return res.status(400).json({ message: "กรุณาระบุเวลาเข้าและเวลาออก" });
    }
    if (checkOutTime <= checkInTime) {
      return res.status(400).json({ message: "เวลาออกต้องมากกว่าเวลาเข้า" });
    }
    const checkInFiles = req.files?.check_in_evidence ?? [];
    const checkOutFiles = req.files?.check_out_evidence ?? [];
    if (!checkInFiles.length || !checkOutFiles.length) {
      return res.status(400).json({ message: "กรุณาแนบหลักฐานตอนเข้างานและออกงานอย่างละ 1 ไฟล์" });
    }

    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO event_time_logs (event_id, user_id, event_date, check_in_time, check_out_time, check_in_at, check_out_at, status, approved_by, approved_at, approval_comment)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW(), 'pending', NULL, NULL, NULL)
       ON DUPLICATE KEY UPDATE check_in_time = VALUES(check_in_time), check_out_time = VALUES(check_out_time),
         check_in_at = NOW(), check_out_at = NOW(), status = 'pending', approved_by = NULL, approved_at = NULL, approval_comment = NULL`,
      [eventId, req.user.id, eventDate, checkInTime, checkOutTime]
    );
    const [[log]] = await conn.query(
      "SELECT id, event_id, user_id, event_date, check_in_time, check_out_time, check_in_at, check_out_at, status FROM event_time_logs WHERE event_id = ? AND user_id = ? AND event_date = ?",
      [eventId, req.user.id, eventDate]
    );
    await conn.query("DELETE FROM event_time_attachments WHERE event_time_log_id = ?", [log.id]);
    const evidenceFiles = [
      ...checkInFiles.map((file) => ({ file, evidenceType: "check_in" })),
      ...checkOutFiles.map((file) => ({ file, evidenceType: "check_out" })),
    ];
    await conn.query(
      `INSERT INTO event_time_attachments (event_time_log_id, evidence_type, original_name, stored_name, mime_type, size)
       VALUES ${evidenceFiles.map(() => "(?, ?, ?, ?, ?, ?)").join(", ")}`,
      evidenceFiles.flatMap(({ file, evidenceType }) => [log.id, evidenceType, normalizeOriginalName(file.originalname), file.filename, file.mimetype, file.size])
    );
    await logAudit({
      req,
      action: "event.attendance_submit",
      targetType: "event",
      targetId: eventId,
      after: { event_date: eventDate, check_in_time: checkInTime, check_out_time: checkOutTime, attachments: evidenceFiles.length },
      conn,
    });
    await conn.commit();
    res.json(log);
  } catch (err) {
    await conn.rollback();
    const uploadedFiles = [...(req.files?.check_in_evidence ?? []), ...(req.files?.check_out_evidence ?? [])];
    if (uploadedFiles.length) {
      await Promise.allSettled(uploadedFiles.map((file) => fs.unlink(path.resolve(eventEvidenceDir, file.filename))));
    }
    next(err);
  } finally {
    conn.release();
  }
});

router.post("/:id/check-out", csrfProtect, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const eventId = Number(req.params.id);
    const eventDate = String(req.body.event_date ?? "").slice(0, 10);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ message: "Event ไม่ถูกต้อง" });
    }
    const event = await assertEventAttendee(eventId, req.user.id, conn);
    if (!event) return res.status(403).json({ message: "คุณไม่ได้อยู่ในรายชื่อผู้เข้าร่วม/Lead ของ Event นี้" });
    if (!isDateInsideEvent(eventDate, event)) {
      return res.status(400).json({ message: "วันที่ลงเวลาไม่อยู่ในช่วง Event" });
    }

    const [[existing]] = await conn.query(
      "SELECT check_in_at, check_out_at FROM event_time_logs WHERE event_id = ? AND user_id = ? AND event_date = ?",
      [eventId, req.user.id, eventDate]
    );
    if (!existing?.check_in_at) {
      return res.status(400).json({ message: "กรุณาลงเวลาเข้าก่อนลงเวลาออก" });
    }

    await conn.beginTransaction();
    await conn.query(
      `UPDATE event_time_logs
       SET check_out_at = COALESCE(check_out_at, NOW())
       WHERE event_id = ? AND user_id = ? AND event_date = ?`,
      [eventId, req.user.id, eventDate]
    );
    const [[log]] = await conn.query(
      "SELECT event_id, user_id, event_date, check_in_at, check_out_at FROM event_time_logs WHERE event_id = ? AND user_id = ? AND event_date = ?",
      [eventId, req.user.id, eventDate]
    );
    await logAudit({
      req,
      action: "event.check_out",
      targetType: "event",
      targetId: eventId,
      after: { event_date: eventDate, check_out_at: log.check_out_at },
      conn,
    });
    await conn.commit();
    res.json(log);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

async function canApproveAttendance(req, log, conn = pool) {
  if (log.user_id === req.user.id) return false;
  if (req.user.role === "admin") return true;
  if (req.user.role === "manager") return log.department === req.user.department;
  if (req.user.role === "lead") {
    const [[row]] = await conn.query("SELECT supervisor_id FROM users WHERE id = ? LIMIT 1", [log.user_id]);
    return row?.supervisor_id === req.user.id;
  }
  if (req.user.role === "assistant manager") {
    const [[row]] = await conn.query(
      `SELECT 1 AS ok
       FROM event_leads el
       JOIN users event_lead ON event_lead.id = el.lead_id
       WHERE el.event_id = ? AND event_lead.supervisor_id = ?
       LIMIT 1`,
      [log.event_id, req.user.id]
    );
    return Boolean(row?.ok);
  }
  return false;
}

router.patch("/attendance/:logId/:action", csrfProtect, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const action = req.params.action;
    if (!["approve", "reject"].includes(action)) return res.status(400).json({ message: "action ไม่ถูกต้อง" });
    const [[log]] = await conn.query(
      `SELECT etl.*, e.department
       FROM event_time_logs etl
       JOIN events e ON e.id = etl.event_id
       WHERE etl.id = ?
       LIMIT 1`,
      [req.params.logId]
    );
    if (!log) return res.status(404).json({ message: "ไม่พบรายการลงเวลา" });
    if (log.status !== "pending") return res.status(400).json({ message: "รายการนี้ไม่ได้อยู่ในสถานะรอยืนยัน" });
    if (!(await canApproveAttendance(req, log, conn))) return res.status(403).json({ message: "ไม่มีสิทธิ์ยืนยันรายการนี้" });

    const status = action === "approve" ? "approved" : "rejected";
    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : null;
    await conn.beginTransaction();
    await conn.query(
      "UPDATE event_time_logs SET status = ?, approved_by = ?, approved_at = NOW(), approval_comment = ? WHERE id = ?",
      [status, req.user.id, comment || null, log.id]
    );
    await logAudit({
      req,
      action: `event.attendance_${status}`,
      targetType: "event_time_log",
      targetId: log.id,
      before: { status: log.status },
      after: { status, comment },
      conn,
    });
    await conn.commit();
    const [[updated]] = await pool.query(
      `SELECT etl.*, u.full_name, u.employee_code, u.department, approver.full_name AS approver_name
       FROM event_time_logs etl
       JOIN users u ON u.id = etl.user_id
       LEFT JOIN users approver ON approver.id = etl.approved_by
       WHERE etl.id = ?`,
      [log.id]
    );
    res.json(updated);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

export default router;

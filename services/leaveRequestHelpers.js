import { calculateLeaveHours, leaveHoursToDays } from "./leaveTime.js";

export const latestLeaveApprovalJoin = `
      LEFT JOIN (
        SELECT la1.*
        FROM leave_approvals la1
        JOIN (
          SELECT leave_request_id, MAX(id) AS id
          FROM leave_approvals
          GROUP BY leave_request_id
        ) latest_la ON latest_la.id = la1.id
      ) la ON la.leave_request_id = lr.id`;

export function yearBounds(year) {
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear) || numericYear < 1000 || numericYear > 9999) return null;
  return [`${numericYear}-01-01`, `${numericYear + 1}-01-01`];
}

export function mapLeaveRequestRow(row, { includeUser = false } = {}) {
  const isHour = Boolean(row.start_time);
  const isHalfDay = !isHour && Number(row.total_days ?? 0) === 0.5;
  const totalHours = isHour && row.start_time && row.end_time
    ? calculateLeaveHours(row.start_time, row.end_time)
    : null;

  const mapped = {
    ...row,
    leave_unit: isHour ? "hour" : isHalfDay ? "half_day" : "day",
    total_hours: totalHours,
    leave_type: {
      id: row.leave_type_id,
      name: row.leave_type_name,
      description: row.leave_type_description,
      max_days: row.leave_type_max_days,
    },
  };

  if (includeUser) {
    mapped.user = {
      id: row.user_id,
      full_name: row.user_full_name,
      employee_code: row.employee_code,
      department: row.department,
      role: row.user_role,
      supervisor_id: row.supervisor_id,
      email: row.email,
      email_2: row.email_2,
      phone: row.phone,
    };
  }

  return mapped;
}

export function getLeaveDaysFromRow(row) {
  if (row.start_time && row.end_time) {
    return leaveHoursToDays(calculateLeaveHours(row.start_time, row.end_time));
  }
  return Number(row.total_days ?? 0);
}

export function balanceKey(name, id) {
  return String(name ?? id).trim().toLowerCase();
}

export function attachmentUrl(id) {
  return `/api/leave-requests/attachments/${id}`;
}

export async function attachLeaveFiles(pool, rows) {
  if (!rows.length) return rows;
  const ids = rows.map((row) => row.id);
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

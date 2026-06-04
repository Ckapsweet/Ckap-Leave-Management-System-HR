export function hasEmail(user) {
  return Boolean(user?.email || user?.email_2);
}

export function isFinalApprover(role) {
  return ["manager", "admin"].includes(role);
}

export function canManageDepartment(user, department) {
  if (user.role === "admin" || user.role === "manager" || user.role === "hr") return true;
  return user.role !== "assistant manager" || user.department === department;
}

export function canActOnWorkflow(user, targetRow) {
  return user.role === "admin" || targetRow.current_assignee_id === user.id;
}

export async function getNextAssignee(conn, currentApproverId) {
  const [rows] = await conn.query(
    "SELECT role, supervisor_id, department FROM users WHERE id = ? AND is_active = 1",
    [currentApproverId]
  );
  const approver = rows[0];
  if (!approver) return null;

  const nextRoleMap = {
    lead: "assistant manager",
    "assistant manager": "manager",
  };
  const nextRole = nextRoleMap[approver.role];
  if (!nextRole) return null;

  if (approver.supervisor_id) {
    const [supRows] = await conn.query(
      "SELECT id, role, email, email_2 FROM users WHERE id = ? AND is_active = 1",
      [approver.supervisor_id]
    );
    if (supRows[0]?.role === nextRole && hasEmail(supRows[0])) return supRows[0].id;
    if (supRows[0]?.role === nextRole) {
      console.warn("[mail] next assignee supervisor missing email", {
        currentApproverId,
        nextRole,
        supervisorId: supRows[0].id,
      });
    }
  }

  const [deptRows] = await conn.query(
    `SELECT id, email, email_2
     FROM users
     WHERE role = ?
       AND department = ?
       AND is_active = 1
       AND (
         (email IS NOT NULL AND TRIM(email) <> '')
         OR (email_2 IS NOT NULL AND TRIM(email_2) <> '')
       )
     LIMIT 1`,
    [nextRole, approver.department]
  );
  if (deptRows[0]) return deptRows[0].id;

  const [anyRows] = await conn.query(
    "SELECT id FROM users WHERE role = ? AND department = ? AND is_active = 1 LIMIT 1",
    [nextRole, approver.department]
  );
  if (anyRows[0]) {
    console.warn("[mail] next assignee selected without email", {
      currentApproverId,
      nextRole,
      selectedAssigneeId: anyRows[0].id,
    });
  }
  return anyRows[0]?.id ?? null;
}

export async function approveWorkflowRequest({
  conn,
  requestTable,
  approvalTable,
  approvalRequestColumn,
  requestId,
  approver,
  comment,
  targetRow,
  onFinalApprove,
}) {
  const now = new Date();
  const finalApproval = isFinalApprover(approver.role);

  if (finalApproval) {
    await conn.query(
      `UPDATE ${requestTable} SET status = 'approved', approved_by = ?, approved_at = ?, current_assignee_id = NULL WHERE id = ?`,
      [approver.id, now, requestId]
    );
    await onFinalApprove?.({ now });
  } else {
    const nextAssigneeId = await getNextAssignee(conn, approver.id);
    await conn.query(
      `UPDATE ${requestTable} SET current_assignee_id = ? WHERE id = ?`,
      [nextAssigneeId, requestId]
    );
  }

  await conn.query(
    `INSERT INTO ${approvalTable} (${approvalRequestColumn}, approver_id, status, comment, approved_at)
     VALUES (?, ?, 'approved', ?, ?)
     ON DUPLICATE KEY UPDATE status = 'approved', comment = ?, approved_at = ?`,
    [requestId, approver.id, comment, now, comment, now]
  );

  return {
    before: workflowSnapshot(targetRow),
    now,
    finalApproval,
    status: finalApproval ? "approved" : "pending",
  };
}

export async function rejectWorkflowRequest({
  conn,
  requestTable,
  approvalTable,
  approvalRequestColumn,
  requestId,
  approver,
  comment,
  targetRow,
}) {
  const now = new Date();

  await conn.query(
    `UPDATE ${requestTable} SET status = 'rejected', approved_by = ?, approved_at = ?, current_assignee_id = NULL WHERE id = ?`,
    [approver.id, now, requestId]
  );
  await conn.query(
    `INSERT INTO ${approvalTable} (${approvalRequestColumn}, approver_id, status, comment, approved_at)
     VALUES (?, ?, 'rejected', ?, ?)
     ON DUPLICATE KEY UPDATE status = 'rejected', comment = ?, approved_at = ?`,
    [requestId, approver.id, comment, now, comment, now]
  );

  return {
    before: workflowSnapshot(targetRow),
    now,
    status: "rejected",
  };
}

function workflowSnapshot(row) {
  return {
    status: row.status,
    approved_by: row.approved_by,
    approved_at: row.approved_at,
    current_assignee_id: row.current_assignee_id,
  };
}

import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import express from "express";
import request from "supertest";

const mockUser = {
  id: 7,
  employee_code: "EMP007",
  full_name: "Test User",
  department: "IT",
  role: "user",
  supervisor_id: 3,
  email: "user@example.com",
  email_2: null,
};

const conn = {
  query: jest.fn(),
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
};

const pool = {
  getConnection: jest.fn(),
  query: jest.fn(),
};

const logAudit = jest.fn();
const notifyLeaveRequestSubmitted = jest.fn();
const notifyLeaveRequestCreated = jest.fn();
const notifyLeaveRequestForwarded = jest.fn();
const notifyLeaveRequestResolved = jest.fn();

jest.unstable_mockModule("../../config/db.js", () => ({
  default: pool,
}));

jest.unstable_mockModule("../../middleware/auth.js", () => ({
  authenticate: (req, _res, next) => {
    req.user = mockUser;
    next();
  },
  requireAdmin: (_req, _res, next) => next(),
  csrfProtect: (_req, _res, next) => next(),
}));

jest.unstable_mockModule("../../middleware/audit.js", () => ({
  logAudit,
}));

jest.unstable_mockModule("../../middleware/upload.js", () => ({
  leaveAttachmentDir: "/tmp/leave-attachments",
  normalizeOriginalName: (name) => name,
  uploadLeaveAttachments: {
    array: () => (_req, _res, next) => next(),
  },
}));

jest.unstable_mockModule("../../services/mailService.js", () => ({
  notifyLeaveRequestSubmitted,
  notifyLeaveRequestCreated,
  notifyLeaveRequestForwarded,
  notifyLeaveRequestResolved,
}));

let app;
let adminApp;
let insertedLeaveRequestParams;
let insertedApprovalParams;
let deletedLeaveRequestId;
let deletedApprovalRequestId;

function makeCreatedRow(params) {
  const [
    userId,
    leaveTypeId,
    startDate,
    endDate,
    startTime,
    endTime,
    totalDays,
    requestType,
    reason,
    status,
    approvedBy,
    approvedAt,
    currentAssigneeId,
  ] = params;

  return {
    id: 101,
    user_id: userId,
    leave_type_id: Number(leaveTypeId),
    start_date: startDate,
    end_date: endDate,
    start_time: startTime,
    end_time: endTime,
    total_days: totalDays,
    request_type: requestType,
    reason,
    status,
    approved_by: approvedBy,
    approved_at: approvedAt,
    current_assignee_id: currentAssigneeId,
    created_at: "2026-05-13T01:00:00.000Z",
    leave_type_name: "Annual Leave",
    leave_type_description: "Annual leave",
    leave_type_max_days: 10,
    requester_full_name: mockUser.full_name,
    requester_employee_code: mockUser.employee_code,
    requester_email: mockUser.email,
    requester_email_2: mockUser.email_2,
    assignee_full_name: "Lead User",
    assignee_employee_code: "EMP003",
    assignee_email: "lead@example.com",
    assignee_email_2: null,
  };
}

function mockCreateLeaveQueries() {
  mockCreateLeaveQueriesWithOptions();
}

function mockCreateLeaveQueriesWithOptions({
  balance = { user_id: mockUser.id, leave_type_id: 1, total_days: 10, used_days: 1, year: 2026 },
  overlap = [],
} = {}) {
  conn.query.mockImplementation(async (sql, params) => {
    if (sql.includes("FROM leave_types")) {
      return [[{ id: 1, name: "Annual Leave", description: "Annual leave", max_days: 10 }]];
    }

    if (sql.includes("FROM leave_balances")) {
      return [[balance].filter(Boolean)];
    }

    if (sql.includes("SELECT id FROM leave_requests") && sql.includes("start_time IS NULL")) {
      return [overlap];
    }

    if (sql.includes("JOIN users u2")) {
      return [[{ id: 3, role: "lead", email: "lead@example.com", email_2: null, department: "IT" }]];
    }

    if (sql.includes("INSERT INTO leave_requests")) {
      insertedLeaveRequestParams = params;
      return [{ insertId: 101 }];
    }

    if (sql.includes("INSERT INTO leave_approvals")) {
      insertedApprovalParams = params;
      return [{ affectedRows: 1 }];
    }

    return [[]];
  });

  pool.query.mockImplementation(async (sql) => {
    if (sql.includes("FROM leave_requests lr") && sql.includes("requester.full_name")) {
      return [[makeCreatedRow(insertedLeaveRequestParams)]];
    }

    return [[]];
  });
}

function mockCancelQueries(row) {
  conn.query.mockImplementation(async (sql, params) => {
    if (sql.includes("SELECT * FROM leave_requests")) {
      return [[row]];
    }

    if (sql.includes("SELECT stored_name FROM leave_request_attachments")) {
      return [[]];
    }

    if (sql.includes("DELETE FROM leave_approvals")) {
      deletedApprovalRequestId = params[0];
      return [{ affectedRows: 1 }];
    }

    if (sql.includes("DELETE FROM leave_requests")) {
      deletedLeaveRequestId = params[0];
      return [{ affectedRows: 1 }];
    }

    return [[]];
  });
}

function makePendingRequest(overrides = {}) {
  return {
    id: 201,
    user_id: 22,
    leave_type_id: 1,
    start_date: "2026-05-13",
    end_date: "2026-05-13",
    start_time: null,
    end_time: null,
    total_days: 1,
    request_type: "leave",
    reason: "Annual leave",
    status: "pending",
    approved_by: null,
    approved_at: null,
    current_assignee_id: mockUser.id,
    user_dept: mockUser.department,
    user_supervisor_id: mockUser.id,
    requester_full_name: "Requester",
    requester_employee_code: "EMP022",
    requester_email: "requester@example.com",
    requester_email_2: null,
    leave_type_name: "Annual Leave",
    ...overrides,
  };
}

function makeLeaveListRow(overrides = {}) {
  return {
    id: 501,
    user_id: mockUser.id,
    leave_type_id: 1,
    start_date: "2026-05-13",
    end_date: "2026-05-13",
    start_time: "09:00",
    end_time: "11:30",
    total_days: 0.3,
    request_type: "leave",
    reason: "Hourly leave",
    status: "approved",
    approved_by: 9,
    approved_at: "2026-05-13T03:00:00.000Z",
    current_assignee_id: null,
    created_at: "2026-05-13T01:00:00.000Z",
    leave_type_name: "Annual Leave",
    leave_type_description: "Annual leave",
    leave_type_max_days: 10,
    approver_name: "Manager",
    comment: "Approved",
    user_full_name: mockUser.full_name,
    employee_code: mockUser.employee_code,
    department: mockUser.department,
    user_role: mockUser.role,
    supervisor_id: mockUser.supervisor_id,
    email: mockUser.email,
    email_2: mockUser.email_2,
    phone: null,
    ...overrides,
  };
}

function mockAdminLeaveActionQueries(row = makePendingRequest()) {
  conn.query.mockImplementation(async (sql, params) => {
    if (sql.includes("FROM leave_requests lr") && sql.includes("JOIN users u")) {
      return [[row]];
    }

    if (sql.includes("UPDATE leave_requests SET status = 'approved'")) {
      return [{ affectedRows: 1 }];
    }

    if (sql.includes("UPDATE leave_requests SET status = 'rejected'")) {
      return [{ affectedRows: 1 }];
    }

    if (sql.includes("UPDATE user_leave_pool")) {
      return [{ affectedRows: 1 }];
    }

    if (sql.includes("INSERT INTO leave_balances")) {
      return [{ affectedRows: 1 }];
    }

    if (sql.includes("INSERT INTO leave_approvals")) {
      insertedApprovalParams = params;
      return [{ affectedRows: 1 }];
    }

    return [[]];
  });

  pool.query.mockImplementation(async (sql) => {
    if (sql.includes("SELECT full_name, employee_code, email, email_2 FROM users")) {
      return [[{
        full_name: mockUser.full_name,
        employee_code: mockUser.employee_code,
        email: mockUser.email,
        email_2: mockUser.email_2,
      }]];
    }

    return [[]];
  });
}

beforeAll(async () => {
  const { default: leaveRequestRoutes } = await import("../leaveRequests.js");
  const { default: adminRoutes } = await import("../admin.js");
  app = express();
  app.use(express.json());
  app.use("/api/leave-requests", leaveRequestRoutes);
  adminApp = express();
  adminApp.use(express.json());
  adminApp.use("/api/admin", adminRoutes);
});

beforeEach(() => {
  insertedLeaveRequestParams = null;
  insertedApprovalParams = null;
  deletedLeaveRequestId = null;
  deletedApprovalRequestId = null;
  Object.assign(mockUser, {
    id: 7,
    employee_code: "EMP007",
    full_name: "Test User",
    department: "IT",
    role: "user",
    supervisor_id: 3,
    email: "user@example.com",
    email_2: null,
  });
  jest.clearAllMocks();
  pool.getConnection.mockResolvedValue(conn);
  conn.beginTransaction.mockResolvedValue();
  conn.commit.mockResolvedValue();
  conn.rollback.mockResolvedValue();
  conn.release.mockReturnValue();
  logAudit.mockResolvedValue();
  notifyLeaveRequestSubmitted.mockResolvedValue();
  notifyLeaveRequestCreated.mockResolvedValue();
  notifyLeaveRequestForwarded.mockResolvedValue();
  notifyLeaveRequestResolved.mockResolvedValue();
  mockCreateLeaveQueries();
});

describe("GET leave request lists", () => {
  it("uses only the latest approval row for my leave list to avoid duplicate requests", async () => {
    pool.query.mockImplementation(async (sql) => {
      if (sql.includes("FROM leave_request_attachments")) return [[]];
      return [[makeLeaveListRow()]];
    });

    const res = await request(app)
      .get("/api/leave-requests/my")
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      id: 501,
      leave_unit: "hour",
      total_hours: 2.5,
      comment: "Approved",
    });

    const sql = pool.query.mock.calls[0][0];
    expect(sql).toContain("MAX(id) AS id");
    expect(sql).not.toContain("LEFT JOIN leave_approvals la ON la.leave_request_id = lr.id");
  });

  it("uses only the latest approval row for admin leave list to avoid duplicate requests", async () => {
    mockUser.role = "manager";
    pool.query.mockImplementation(async (sql) => {
      if (sql.includes("FROM leave_request_attachments")) return [[]];
      return [[makeLeaveListRow({ user_id: 22 })]];
    });

    const res = await request(adminApp)
      .get("/api/admin/leave-requests")
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      id: 501,
      leave_unit: "hour",
      total_hours: 2.5,
      comment: "Approved",
      user: expect.objectContaining({ id: 22 }),
    });

    const sql = pool.query.mock.calls[0][0];
    expect(sql).toContain("MAX(id) AS id");
    expect(sql).not.toContain("LEFT JOIN leave_approvals la ON la.leave_request_id = lr.id");
  });
});

describe("POST /api/admin/leave-requests - historical leave", () => {
  it("creates an approved historical leave for the selected employee and updates balances", async () => {
    mockUser.role = "admin";
    let balanceUpdated = false;
    let poolSynced = false;

    conn.query.mockImplementation(async (sql, params) => {
      if (sql.includes("FROM users WHERE id = ?")) {
        return [[{
          id: 22,
          full_name: "Historical User",
          employee_code: "EMP022",
          department: "Marketing",
          role: "user",
          supervisor_id: null,
          email: null,
          email_2: null,
        }]];
      }

      if (sql.includes("INSERT INTO leave_balances")) {
        balanceUpdated = true;
        return [{ affectedRows: 1 }];
      }

      if (sql.includes("INSERT INTO user_leave_pool")) {
        poolSynced = true;
        return [{ affectedRows: 1 }];
      }

      if (sql.includes("FROM leave_types WHERE id = ?")) {
        return [[{ id: 1, name: "Annual Leave", max_days: 10 }]];
      }

      if (sql.includes("SELECT id FROM leave_requests") && sql.includes("start_time IS NULL")) {
        return [[]];
      }

      if (sql.includes("INSERT INTO leave_requests")) {
        insertedLeaveRequestParams = params;
        return [{ insertId: 601 }];
      }

      if (sql.includes("INSERT INTO leave_approvals")) {
        insertedApprovalParams = params;
        return [{ affectedRows: 1 }];
      }

      return [[]];
    });

    pool.query.mockImplementation(async (sql) => {
      if (sql.includes("FROM leave_request_attachments")) return [[]];
      if (sql.includes("FROM leave_requests lr") && sql.includes("u.full_name AS user_full_name")) {
        return [[{
          id: 601,
          user_id: 22,
          leave_type_id: 1,
          start_date: "2026-05-04",
          end_date: "2026-05-05",
          start_time: null,
          end_time: null,
          total_days: 2,
          request_type: "leave",
          reason: "ย้อนหลัง",
          status: "approved",
          approved_by: mockUser.id,
          approved_at: "2026-06-11T08:00:00.000Z",
          current_assignee_id: null,
          created_at: "2026-06-11T08:00:00.000Z",
          user_full_name: "Historical User",
          employee_code: "EMP022",
          department: "Marketing",
          user_role: "user",
          supervisor_id: null,
          email: null,
          email_2: null,
          phone: null,
          leave_type_name: "Annual Leave",
          leave_type_max_days: 10,
          approver_name: "Admin",
          comment: "บันทึกประวัติย้อนหลังโดยผู้ดูแล",
        }]];
      }
      return [[]];
    });

    const res = await request(adminApp)
      .post("/api/admin/leave-requests")
      .send({
        user_id: 22,
        leave_type_id: 1,
        start_date: "2026-05-04",
        end_date: "2026-05-05",
        request_type: "leave",
        reason: "ย้อนหลัง",
      })
      .expect(201);

    expect(insertedLeaveRequestParams[0]).toBe(22);
    expect(insertedLeaveRequestParams[6]).toBe(2);
    expect(insertedLeaveRequestParams[9]).toBe(mockUser.id);
    expect(insertedApprovalParams[0]).toBe(601);
    expect(balanceUpdated).toBe(true);
    expect(poolSynced).toBe(true);
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: "leave.create",
      targetId: 601,
      note: "บันทึกประวัติการลาย้อนหลัง",
    }));
    expect(res.body).toMatchObject({
      id: 601,
      user_id: 22,
      status: "approved",
      user: {
        id: 22,
        full_name: "Historical User",
      },
    });
  });
});

describe("DELETE /api/admin/leave-requests/:id", () => {
  it("lets admin delete an approved leave request and restores used balance", async () => {
    mockUser.role = "admin";
    let restoredBalance = false;
    let poolSynced = false;
    let approvalDeleted = false;
    let requestDeleted = false;

    conn.query.mockImplementation(async (sql) => {
      if (sql.includes("FROM leave_requests lr") && sql.includes("JOIN users u")) {
        return [[{
          id: 701,
          user_id: 22,
          leave_type_id: 1,
          start_date: "2026-05-04",
          end_date: "2026-05-05",
          start_time: null,
          end_time: null,
          total_days: 2,
          reason: "ย้อนหลัง",
          status: "approved",
          department: "Marketing",
        }]];
      }

      if (sql.includes("SELECT stored_name FROM leave_request_attachments")) {
        return [[]];
      }

      if (sql.includes("UPDATE leave_balances")) {
        restoredBalance = true;
        return [{ affectedRows: 1 }];
      }

      if (sql.includes("INSERT INTO user_leave_pool")) {
        poolSynced = true;
        return [{ affectedRows: 1 }];
      }

      if (sql.includes("DELETE FROM leave_approvals")) {
        approvalDeleted = true;
        return [{ affectedRows: 1 }];
      }

      if (sql.includes("DELETE FROM leave_requests")) {
        requestDeleted = true;
        return [{ affectedRows: 1 }];
      }

      return [[]];
    });

    const res = await request(adminApp)
      .delete("/api/admin/leave-requests/701")
      .expect(200);

    expect(restoredBalance).toBe(true);
    expect(poolSynced).toBe(true);
    expect(approvalDeleted).toBe(true);
    expect(requestDeleted).toBe(true);
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: "leave.cancel",
      targetId: 701,
      note: "ลบรายการลาโดยผู้ดูแล",
    }));
    expect(res.body.message).toBe("ลบรายการลาเรียบร้อย");
  });
});

describe("PATCH /api/admin/leave-requests/:id", () => {
  it("updates an approved leave request and rebalances used days", async () => {
    mockUser.role = "admin";
    let restoredOldBalance = false;
    let addedNewBalance = false;
    let poolSyncCount = 0;

    conn.query.mockImplementation(async (sql, params) => {
      if (sql.includes("FROM leave_requests lr") && sql.includes("JOIN users u")) {
        return [[{
          id: 801,
          user_id: 22,
          leave_type_id: 1,
          start_date: "2026-05-04",
          end_date: "2026-05-05",
          start_time: null,
          end_time: null,
          total_days: 2,
          request_type: "leave",
          reason: "old",
          status: "approved",
          department: "Marketing",
        }]];
      }

      if (sql.includes("SELECT id, department FROM users")) {
        return [[{ id: 22, department: "Marketing" }]];
      }

      if (sql.includes("UPDATE leave_balances")) {
        restoredOldBalance = true;
        return [{ affectedRows: 1 }];
      }

      if (sql.includes("INSERT INTO leave_balances")) {
        addedNewBalance = true;
        return [{ affectedRows: 1 }];
      }

      if (sql.includes("INSERT INTO user_leave_pool")) {
        poolSyncCount += 1;
        return [{ affectedRows: 1 }];
      }

      if (sql.includes("FROM leave_types WHERE id = ?")) {
        return [[{ id: 1, name: "Annual Leave", max_days: 10 }]];
      }

      if (sql.includes("SELECT id FROM leave_requests") && sql.includes("id <>")) {
        return [[]];
      }

      if (sql.includes("UPDATE leave_requests")) {
        return [{ affectedRows: 1 }];
      }

      return [[]];
    });

    pool.query.mockImplementation(async (sql) => {
      if (sql.includes("FROM leave_request_attachments")) return [[]];
      if (sql.includes("FROM leave_requests lr") && sql.includes("u.full_name AS user_full_name")) {
        return [[{
          id: 801,
          user_id: 22,
          leave_type_id: 1,
          start_date: "2026-05-04",
          end_date: "2026-05-06",
          start_time: null,
          end_time: null,
          total_days: 3,
          request_type: "leave",
          reason: "updated",
          status: "approved",
          approved_by: mockUser.id,
          approved_at: "2026-06-11T08:00:00.000Z",
          current_assignee_id: null,
          created_at: "2026-06-11T08:00:00.000Z",
          user_full_name: "Historical User",
          employee_code: "EMP022",
          department: "Marketing",
          user_role: "user",
          supervisor_id: null,
          email: null,
          email_2: null,
          phone: null,
          leave_type_name: "Annual Leave",
          leave_type_max_days: 10,
          approver_name: "Admin",
          comment: null,
        }]];
      }
      return [[]];
    });

    const res = await request(adminApp)
      .patch("/api/admin/leave-requests/801")
      .send({
        user_id: 22,
        leave_type_id: 1,
        start_date: "2026-05-04",
        end_date: "2026-05-06",
        request_type: "leave",
        reason: "updated",
      })
      .expect(200);

    expect(restoredOldBalance).toBe(true);
    expect(addedNewBalance).toBe(true);
    expect(poolSyncCount).toBe(1);
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: "leave.update",
      targetId: 801,
      note: "แก้ไขรายการลาโดยผู้ดูแล",
    }));
    expect(res.body).toMatchObject({
      id: 801,
      total_days: 3,
      reason: "updated",
    });
  });
});

describe("POST /api/leave-requests - full-day leave", () => {
  it("creates a full-day pending leave and checks overlapping approved day leave", async () => {
    const res = await request(app)
      .post("/api/leave-requests")
      .send({
        leave_type_id: 1,
        start_date: "2026-05-13",
        end_date: "2026-05-14",
        request_type: "leave",
        reason: "Family errand",
        total_days: 2,
      })
      .expect(201);

    expect(res.body).toMatchObject({
      id: 101,
      leave_unit: "day",
      total_hours: null,
      total_days: 2,
      request_type: "leave",
      status: "pending",
    });
    expect(insertedLeaveRequestParams).toEqual([
      mockUser.id,
      1,
      "2026-05-13",
      "2026-05-14",
      null,
      null,
      2,
      "leave",
      "Family errand",
      "pending",
      null,
      null,
      3,
    ]);
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining("start_time IS NULL"),
      [mockUser.id, "2026-05-14", "2026-05-13"]
    );
  });

  it("rejects a full-day leave when it overlaps an approved day leave", async () => {
    mockCreateLeaveQueriesWithOptions({ overlap: [{ id: 99 }] });

    await request(app)
      .post("/api/leave-requests")
      .send({
        leave_type_id: 1,
        start_date: "2026-05-13",
        end_date: "2026-05-13",
        request_type: "leave",
        reason: "Overlap day",
        total_days: 1,
      })
      .expect(409);

    expect(insertedLeaveRequestParams).toBeNull();
    expect(conn.beginTransaction).not.toHaveBeenCalled();
  });
});

describe("POST /api/leave-requests - half-day leave", () => {
  it("creates a 0.5 day pending leave without time fields", async () => {
    const res = await request(app)
      .post("/api/leave-requests")
      .send({
        leave_type_id: 1,
        start_date: "2026-05-13",
        end_date: "2026-05-13",
        request_type: "leave",
        reason: "Half day errand",
        total_days: 0.5,
      })
      .expect(201);

    expect(insertedLeaveRequestParams[6]).toBe(0.5);
    expect(insertedLeaveRequestParams[4]).toBeNull();
    expect(insertedLeaveRequestParams[5]).toBeNull();
    expect(res.body.total_days).toBe(0.5);
  });
});

describe("POST /api/leave-requests - balance validation", () => {
  it("rejects a leave request when remaining balance is insufficient", async () => {
    mockCreateLeaveQueriesWithOptions({
      balance: { user_id: mockUser.id, leave_type_id: 1, total_days: 2, used_days: 1.5, year: 2026 },
    });

    await request(app)
      .post("/api/leave-requests")
      .send({
        leave_type_id: 1,
        start_date: "2026-05-13",
        end_date: "2026-05-14",
        request_type: "leave",
        reason: "Too much leave",
        total_days: 2,
      })
      .expect(400);

    expect(insertedLeaveRequestParams).toBeNull();
    expect(conn.beginTransaction).not.toHaveBeenCalled();
  });
});

describe("POST /api/leave-requests - hourly leave", () => {
  it("creates an hourly leave request and saves calculated day usage", async () => {
    const res = await request(app)
      .post("/api/leave-requests")
      .send({
        leave_type_id: 1,
        start_date: "2026-05-13",
        end_date: "2026-05-13",
        start_time: "09:00",
        end_time: "12:00",
        request_type: "leave",
        reason: "Personal appointment",
      })
      .expect(201);

    expect(res.body).toMatchObject({
      id: 101,
      leave_unit: "hour",
      total_hours: 3,
      total_days: 0.375,
      request_type: "leave",
      start_time: "09:00",
      end_time: "12:00",
      status: "pending",
    });

    expect(insertedLeaveRequestParams).toEqual([
      mockUser.id,
      1,
      "2026-05-13",
      "2026-05-13",
      "09:00",
      "12:00",
      0.375,
      "leave",
      "Personal appointment",
      "pending",
      null,
      null,
      3,
    ]);
    expect(conn.query).not.toHaveBeenCalledWith(
      expect.stringContaining("start_time IS NULL"),
      expect.anything()
    );
  });
});

describe("POST /api/leave-requests - late request", () => {
  it("creates a late request with hourly calculation and preserves request_type", async () => {
    const res = await request(app)
      .post("/api/leave-requests")
      .send({
        leave_type_id: 1,
        start_date: "2026-05-13",
        end_date: "2026-05-13",
        start_time: "08:00",
        end_time: "09:30",
        request_type: "late",
        reason: "Traffic delay",
      })
      .expect(201);

    expect(res.body).toMatchObject({
      id: 101,
      leave_unit: "hour",
      total_hours: 1.5,
      total_days: 0.1875,
      request_type: "late",
      start_time: "08:00",
      end_time: "09:30",
      status: "pending",
    });

    expect(insertedLeaveRequestParams).toEqual([
      mockUser.id,
      1,
      "2026-05-13",
      "2026-05-13",
      "08:00",
      "09:30",
      0.1875,
      "late",
      "Traffic delay",
      "pending",
      null,
      null,
      3,
    ]);
  });
});

describe("POST /api/leave-requests - manager auto approve", () => {
  it("auto-approves manager requests and updates leave balances", async () => {
    mockUser.role = "manager";

    const res = await request(app)
      .post("/api/leave-requests")
      .send({
        leave_type_id: 1,
        start_date: "2026-05-13",
        end_date: "2026-05-13",
        request_type: "leave",
        reason: "Manager leave",
        total_days: 1,
      })
      .expect(201);

    expect(res.body).toMatchObject({
      status: "approved",
      total_days: 1,
      request_type: "leave",
    });
    expect(insertedLeaveRequestParams[9]).toBe("approved");
    expect(insertedLeaveRequestParams[10]).toBe(mockUser.id);
    expect(insertedLeaveRequestParams[12]).toBeNull();
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE user_leave_pool"),
      [1, mockUser.id, 2026]
    );
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining("ON DUPLICATE KEY UPDATE used_days = used_days + ?"),
      [mockUser.id, 1, 10, 1, 2026, 1]
    );
    expect(insertedApprovalParams).toEqual([101, mockUser.id, expect.any(Date)]);
  });
});

describe("POST /api/leave-requests - notifications", () => {
  it("responds successfully even when background mail fails", async () => {
    const mailError = new Error("SMTP down");
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    notifyLeaveRequestSubmitted.mockRejectedValueOnce(mailError);

    await request(app)
      .post("/api/leave-requests")
      .send({
        leave_type_id: 1,
        start_date: "2026-05-13",
        end_date: "2026-05-13",
        request_type: "leave",
        reason: "Mail should not block",
        total_days: 1,
      })
      .expect(201);

    await new Promise((resolve) => setImmediate(resolve));

    expect(notifyLeaveRequestSubmitted).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith("[mail] leave request notification failed:", "SMTP down");
    consoleSpy.mockRestore();
  });
});

describe("DELETE /api/leave-requests/:id", () => {
  it("cancels pending leave requests", async () => {
    mockCancelQueries(makePendingRequest({ id: 301, user_id: mockUser.id, status: "pending" }));

    await request(app)
      .delete("/api/leave-requests/301")
      .expect(200);

    expect(deletedLeaveRequestId).toBe("301");
    expect(deletedApprovalRequestId).toBe("301");
    expect(conn.commit).toHaveBeenCalled();
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: "leave.cancel",
      targetId: 301,
    }));
  });

  it("rejects cancel for non-pending leave requests", async () => {
    mockCancelQueries(makePendingRequest({ id: 302, user_id: mockUser.id, status: "approved" }));

    await request(app)
      .delete("/api/leave-requests/302")
      .expect(400);

    expect(deletedLeaveRequestId).toBeNull();
    expect(deletedApprovalRequestId).toBeNull();
  });
});

describe("PATCH /api/admin/leave-requests/:id/approve", () => {
  it("approves a pending request as a final manager approval", async () => {
    mockUser.role = "manager";
    mockAdminLeaveActionQueries(makePendingRequest({ id: 401, current_assignee_id: mockUser.id }));

    const res = await request(adminApp)
      .patch("/api/admin/leave-requests/401/approve")
      .send({ comment: "Approved" })
      .expect(200);

    expect(res.body).toMatchObject({
      status: "approved",
      current_assignee_id: null,
    });
    expect(conn.query).toHaveBeenCalledWith(
      "UPDATE leave_requests SET status = 'approved', approved_by = ?, approved_at = ?, current_assignee_id = NULL WHERE id = ?",
      [mockUser.id, expect.any(Date), "401"]
    );
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE user_leave_pool SET used_days = used_days + ?"),
      [1, 22, 2026]
    );
    expect(notifyLeaveRequestResolved).toHaveBeenCalledWith(expect.objectContaining({
      status: "approved",
      comment: "Approved",
    }));
  });
});

describe("PATCH /api/admin/leave-requests/:id/reject", () => {
  it("rejects a pending request and clears the assignee", async () => {
    mockUser.role = "manager";
    mockAdminLeaveActionQueries(makePendingRequest({ id: 402, current_assignee_id: mockUser.id }));

    const res = await request(adminApp)
      .patch("/api/admin/leave-requests/402/reject")
      .send({ comment: "Rejected" })
      .expect(200);

    expect(res.body).toMatchObject({
      status: "rejected",
      current_assignee_id: null,
    });
    expect(conn.query).toHaveBeenCalledWith(
      "UPDATE leave_requests SET status = 'rejected', approved_by = ?, approved_at = ?, current_assignee_id = NULL WHERE id = ?",
      [mockUser.id, expect.any(Date), "402"]
    );
    expect(notifyLeaveRequestResolved).toHaveBeenCalledWith(expect.objectContaining({
      status: "rejected",
      comment: "Rejected",
    }));
  });
});

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
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
  query: vi.fn(),
  beginTransaction: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
};

const pool = {
  getConnection: vi.fn(),
  query: vi.fn(),
};

const logAudit = vi.fn();
const notifyLeaveRequestSubmitted = vi.fn();
const notifyLeaveRequestCreated = vi.fn();
const notifyLeaveRequestForwarded = vi.fn();
const notifyLeaveRequestResolved = vi.fn();

vi.doMock("../../config/db.js", () => ({
  default: pool,
}));

vi.doMock("../../middleware/auth.js", () => ({
  authenticate: (req, _res, next) => {
    req.user = mockUser;
    next();
  },
  requireAdmin: (_req, _res, next) => next(),
  csrfProtect: (_req, _res, next) => next(),
}));

vi.doMock("../../middleware/audit.js", () => ({
  logAudit,
}));

vi.doMock("../../middleware/upload.js", () => ({
  leaveAttachmentDir: "/tmp/leave-attachments",
  normalizeOriginalName: (name) => name,
  uploadLeaveAttachments: {
    array: () => (_req, _res, next) => next(),
  },
}));

vi.doMock("../../services/mailService.js", () => ({
  notifyLeaveRequestSubmitted,
  notifyLeaveRequestCreated,
  notifyLeaveRequestForwarded,
  notifyLeaveRequestResolved,
}));

let app;

beforeAll(async () => {
  const { default: leaveRequestRoutes } = await import("../leaveRequests.js");
  app = express();
  app.use(express.json());
  app.use("/api/leave-requests", leaveRequestRoutes);
});

beforeEach(() => {
  vi.clearAllMocks();
});

const offsiteRow = {
  id: 55,
  user_id: mockUser.id,
  request_type: "offsite",
  status: "approved",
  start_date: "2026-10-12",
  end_date: "2026-10-12",
  total_days: 1,
  reason: "WFH",
};

describe("PATCH /api/leave-requests/:id", () => {
  it("lets the owner edit dates and reason of an offsite request", async () => {
    pool.query
      .mockResolvedValueOnce([[offsiteRow]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .patch("/api/leave-requests/55")
      .send({ start_date: "2026-10-13", end_date: "2026-10-14", reason: "  ออกหน้างาน  " });

    expect(res.status).toBe(200);
    expect(pool.query.mock.calls[0][1]).toEqual(["55", mockUser.id]);
    expect(pool.query.mock.calls[1][1]).toEqual(["2026-10-13", "2026-10-14", 2, "ออกหน้างาน", 55]);
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "leave.update", targetId: 55 }));
  });

  it("rejects editing a normal leave request", async () => {
    pool.query.mockResolvedValueOnce([[{ ...offsiteRow, request_type: "leave" }]]);

    const res = await request(app)
      .patch("/api/leave-requests/55")
      .send({ start_date: "2026-10-13", end_date: "2026-10-13", reason: "x" });

    expect(res.status).toBe(400);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when the request belongs to someone else", async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .patch("/api/leave-requests/55")
      .send({ start_date: "2026-10-13", end_date: "2026-10-13", reason: "x" });

    expect(res.status).toBe(404);
  });

  it("validates the date range and reason", async () => {
    const bad = await request(app)
      .patch("/api/leave-requests/55")
      .send({ start_date: "2026-10-14", end_date: "2026-10-13", reason: "x" });
    const empty = await request(app)
      .patch("/api/leave-requests/55")
      .send({ start_date: "2026-10-13", end_date: "2026-10-13", reason: "   " });

    expect(bad.status).toBe(400);
    expect(empty.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
});

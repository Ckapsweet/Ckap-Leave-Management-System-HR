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
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 7, 9, 0, 0));
});

describe("GET /api/leave-requests/week", () => {
  it("includes the person's later approved leaves beyond the 7-day window", async () => {
    pool.query.mockResolvedValueOnce([[
      { id: 1, user_id: 9, user_name: "A", user_department: "IT", start_date: "2026-10-07", end_date: "2026-10-07", status: "approved" },
      { id: 2, user_id: 9, user_name: "A", user_department: "IT", start_date: "2026-10-14", end_date: "2026-10-14", status: "approved" },
    ]]);

    const res = await request(app).get("/api/leave-requests/week");
    vi.useRealTimers();

    expect(res.status).toBe(200);
    expect(res.body.map((r) => r.id)).toEqual([1, 2]);
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toContain("lr.user_id IN");
    expect(params).toEqual(["IT", "2026-11-06", "2026-10-07", "2026-10-13", "2026-10-07"]);
  });

  it("covers 14 days when asked for two weeks", async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app).get("/api/leave-requests/week?days=14");
    vi.useRealTimers();

    expect(res.status).toBe(200);
    expect(pool.query.mock.calls[0][1]).toEqual(["IT", "2026-11-06", "2026-10-07", "2026-10-20", "2026-10-07"]);
  });

  it("falls back to 7 days and caps large values", async () => {
    pool.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]);

    await request(app).get("/api/leave-requests/week?days=abc");
    await request(app).get("/api/leave-requests/week?days=999");
    vi.useRealTimers();

    expect(pool.query.mock.calls[0][1][3]).toBe("2026-10-13");
    expect(pool.query.mock.calls[1][1][3]).toBe("2026-11-06");
    expect(pool.query.mock.calls[1][1][1]).toBe("2026-11-06");
  });

  it("uses the local date for today", async () => {
    vi.setSystemTime(new Date(2026, 9, 8, 0, 30, 0));
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app).get("/api/leave-requests/today");
    vi.useRealTimers();

    expect(res.status).toBe(200);
    expect(pool.query.mock.calls[0][1]).toContain("2026-10-08");
  });
});

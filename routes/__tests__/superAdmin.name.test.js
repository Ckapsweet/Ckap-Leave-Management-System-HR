import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

const mockUser = { id: 1, employee_code: "ADM001", full_name: "Admin", role: "admin" };
const pool = { query: vi.fn() };
const logAudit = vi.fn();

vi.doMock("../../config/db.js", () => ({ default: pool }));
vi.doMock("../../middleware/auth.js", () => ({
  authenticate: (req, _res, next) => {
    req.user = { ...mockUser };
    next();
  },
  csrfProtect: (_req, _res, next) => next(),
}));
vi.doMock("../../middleware/audit.js", () => ({
  logAudit,
  requireRole: () => (_req, _res, next) => next(),
}));

let app;

beforeAll(async () => {
  const { default: router } = await import("../superAdmin.js");
  app = express();
  app.use(express.json());
  app.use("/api/super-admin", router);
  app.use((err, _req, res, _next) => res.status(500).json({ message: err.message }));
});

beforeEach(() => {
  mockUser.role = "admin";
  pool.query.mockReset();
  logAudit.mockReset();
  pool.query.mockImplementation(async (sql) => {
    if (sql.startsWith("SELECT")) {
      return [[{ id: 5, employee_code: "MKT-0001", full_name: "ชื่อเดิม", english_name: "Old Name" }]];
    }
    return [{ affectedRows: 1 }];
  });
});

describe("PATCH /api/super-admin/users/:id/name", () => {
  it("updates Thai and English names and writes an audit log", async () => {
    const res = await request(app)
      .patch("/api/super-admin/users/5/name")
      .send({ full_name: "  ชื่อใหม่ นามสกุล  ", english_name: "  New Name  " });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ full_name: "ชื่อใหม่ นามสกุล", english_name: "New Name" });
    expect(pool.query).toHaveBeenCalledWith(
      "UPDATE users SET full_name = ?, english_name = ? WHERE id = ?",
      ["ชื่อใหม่ นามสกุล", "New Name", 5]
    );
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: "user.update",
      targetId: 5,
      before: { full_name: "ชื่อเดิม", english_name: "Old Name" },
      after: { full_name: "ชื่อใหม่ นามสกุล", english_name: "New Name" },
    }));
  });

  it("clears the English name when it is blank", async () => {
    const res = await request(app).patch("/api/super-admin/users/5/name").send({ full_name: "ชื่อใหม่", english_name: "   " });
    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE users"), ["ชื่อใหม่", null, 5]);
  });

  it("keeps the English name when it is not sent", async () => {
    const res = await request(app).patch("/api/super-admin/users/5/name").send({ full_name: "ชื่อใหม่" });
    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE users"), ["ชื่อใหม่", "Old Name", 5]);
  });

  it("rejects an empty Thai name", async () => {
    const res = await request(app).patch("/api/super-admin/users/5/name").send({ full_name: "   " });
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("rejects a name longer than the column", async () => {
    const res = await request(app).patch("/api/super-admin/users/5/name").send({ full_name: "ก".repeat(256) });
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalledWith(expect.stringContaining("UPDATE users"), expect.anything());
  });

  it("only lets admins rename users", async () => {
    mockUser.role = "manager";
    const res = await request(app).patch("/api/super-admin/users/5/name").send({ full_name: "ชื่อใหม่" });
    expect(res.status).toBe(403);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing or inactive user", async () => {
    pool.query.mockResolvedValueOnce([[]]);
    const res = await request(app).patch("/api/super-admin/users/99/name").send({ full_name: "ชื่อใหม่" });
    expect(res.status).toBe(404);
    expect(logAudit).not.toHaveBeenCalled();
  });
});

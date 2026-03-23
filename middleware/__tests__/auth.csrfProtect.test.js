// middleware/__tests__/auth.csrfProtect.test.js
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { csrfProtect } from "../auth.js";

// ── Helpers ───────────────────────────────────────────────────

function makeReq({ method = "POST", cookieToken, headerToken } = {}) {
  return {
    method,
    cookies: cookieToken !== undefined ? { csrf_token: cookieToken } : {},
    headers: headerToken !== undefined ? { "x-csrf-token": headerToken } : {},
  };
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn().mockReturnThis(),
  };
}

// ── Tests ─────────────────────────────────────────────────────

describe("csrfProtect — safe methods (ข้าม CSRF check)", () => {
  let next;
  let res;

  beforeEach(() => {
    next = jest.fn();
    res  = makeRes();
  });

  it("GET ผ่านได้โดยไม่ต้องมี token", () => {
    csrfProtect(makeReq({ method: "GET" }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("HEAD ผ่านได้", () => {
    csrfProtect(makeReq({ method: "HEAD" }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("OPTIONS ผ่านได้", () => {
    csrfProtect(makeReq({ method: "OPTIONS" }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("GET ผ่านได้แม้ไม่มี cookie และ header", () => {
    const req = { method: "GET", cookies: {}, headers: {} };
    csrfProtect(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("csrfProtect — POST/PATCH/DELETE ที่ token ถูกต้อง", () => {
  let next;
  let res;

  beforeEach(() => {
    next = jest.fn();
    res  = makeRes();
  });

  it("POST ผ่านเมื่อ token ตรงกัน", () => {
    const token = "abc-123";
    csrfProtect(makeReq({ method: "POST", cookieToken: token, headerToken: token }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("PATCH ผ่านเมื่อ token ตรงกัน", () => {
    const token = "xyz-456";
    csrfProtect(makeReq({ method: "PATCH", cookieToken: token, headerToken: token }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("DELETE ผ่านเมื่อ token ตรงกัน", () => {
    const token = "token-789";
    csrfProtect(makeReq({ method: "DELETE", cookieToken: token, headerToken: token }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("ผ่านเมื่อ token เป็น UUID format", () => {
    const token = "0942517c-4ec0-4f66-a93e-7ac60fbf3e28";
    csrfProtect(makeReq({ method: "POST", cookieToken: token, headerToken: token }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("csrfProtect — POST ที่ token ไม่ถูกต้อง", () => {
  let next;
  let res;

  beforeEach(() => {
    next = jest.fn();
    res  = makeRes();
  });

  it("403 เมื่อไม่มี cookie token", () => {
    csrfProtect(makeReq({ method: "POST", headerToken: "abc-123" }), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "CSRF token invalid" });
    expect(next).not.toHaveBeenCalled();
  });

  it("403 เมื่อไม่มี header token", () => {
    csrfProtect(makeReq({ method: "POST", cookieToken: "abc-123" }), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "CSRF token invalid" });
    expect(next).not.toHaveBeenCalled();
  });

  it("403 เมื่อ token ไม่ตรงกัน", () => {
    csrfProtect(
      makeReq({ method: "POST", cookieToken: "token-A", headerToken: "token-B" }),
      res, next
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "CSRF token invalid" });
    expect(next).not.toHaveBeenCalled();
  });

  it("403 เมื่อทั้ง cookie และ header ไม่มี token", () => {
    csrfProtect(makeReq({ method: "POST" }), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("403 เมื่อ cookie token เป็น empty string", () => {
    csrfProtect(makeReq({ method: "POST", cookieToken: "", headerToken: "abc-123" }), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("403 เมื่อ header token เป็น empty string", () => {
    csrfProtect(makeReq({ method: "POST", cookieToken: "abc-123", headerToken: "" }), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("403 เมื่อ token ต่างกัน case (case-sensitive)", () => {
    csrfProtect(
      makeReq({ method: "POST", cookieToken: "ABC-123", headerToken: "abc-123" }),
      res, next
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("403 เมื่อ cookies เป็น undefined", () => {
    const req = { method: "POST", cookies: undefined, headers: { "x-csrf-token": "abc" } };
    csrfProtect(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("csrfProtect — ไม่เรียก next และ res ซ้ำ", () => {
  it("เรียก next เพียงครั้งเดียวเมื่อผ่าน", () => {
    const next  = jest.fn();
    const res   = makeRes();
    const token = "valid-token";
    csrfProtect(makeReq({ method: "POST", cookieToken: token, headerToken: token }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("ไม่เรียก next เลยเมื่อ token ผิด", () => {
    const next = jest.fn();
    const res  = makeRes();
    csrfProtect(makeReq({ method: "POST", cookieToken: "A", headerToken: "B" }), res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it("response 403 เพียงครั้งเดียวเมื่อ token ผิด", () => {
    const next = jest.fn();
    const res  = makeRes();
    csrfProtect(makeReq({ method: "POST", cookieToken: "A", headerToken: "B" }), res, next);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledTimes(1);
  });
});
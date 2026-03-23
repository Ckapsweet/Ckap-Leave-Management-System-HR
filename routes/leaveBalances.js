// routes/leaveBalances.js
import { Router } from "express";
import pool from "../config/db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// GET /api/leave-balances?year=2026 — pool รวมของ user ที่ login
router.get("/", authenticate, async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getFullYear();

    const [rows] = await pool.query(
      `SELECT * FROM user_leave_pool
       WHERE user_id = ? AND year = ?
       LIMIT 1`,
      [req.user.id, year]
    );

    if (!rows[0]) {
      // ยังไม่มี pool → return ค่าเริ่มต้น
      return res.json({
        id:         null,
        user_id:    req.user.id,
        total_days: 0,
        used_days:  0,
        remaining:  0,
        year:       Number(year),
      });
    }

    const r = rows[0];
    res.json({
      ...r,
      remaining: Math.max(0, r.total_days - r.used_days),
    });
  } catch (err) { next(err); }
});

export default router;
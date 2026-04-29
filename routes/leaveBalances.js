// routes/leaveBalances.js
import { Router } from "express";
import pool from "../config/db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

async function getBalancesByType(userId, year) {
  const [rows] = await pool.query(
    `SELECT lt.id AS leave_type_id, lt.name, lt.max_days AS default_max,
            lb.total_days, lb.used_days
     FROM leave_types lt
     LEFT JOIN leave_balances lb
       ON lb.leave_type_id = lt.id
      AND lb.user_id = ?
      AND lb.year = ?
     ORDER BY lt.id ASC`,
    [userId, year]
  );

  return rows.map((row) => {
    const totalDays = Number(row.total_days ?? row.default_max ?? 0);
    const usedDays = Number(row.used_days ?? 0);

    return {
      leave_type_id: row.leave_type_id,
      name: row.name,
      total_days: totalDays,
      used_days: usedDays,
      remaining: Math.max(0, totalDays - usedDays),
    };
  });
}

// GET /api/leave-balances?year=2026 - pool รวมของ user ที่ login พร้อม balances แยกตามประเภท
router.get("/", authenticate, async (req, res, next) => {
  try {
    const year = Number(req.query.year || new Date().getFullYear());
    const balances = await getBalancesByType(req.user.id, year);

    const [rows] = await pool.query(
      `SELECT * FROM user_leave_pool
       WHERE user_id = ? AND year = ?
       LIMIT 1`,
      [req.user.id, year]
    );

    if (!rows[0]) {
      const totalDays = balances.reduce((sum, balance) => sum + balance.total_days, 0);
      const usedDays = balances.reduce((sum, balance) => sum + balance.used_days, 0);

      return res.json({
        id: null,
        user_id: req.user.id,
        total_days: totalDays,
        used_days: usedDays,
        remaining: Math.max(0, totalDays - usedDays),
        year,
        balances,
      });
    }

    const r = rows[0];
    res.json({
      ...r,
      remaining: Math.max(0, r.total_days - r.used_days),
      balances,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

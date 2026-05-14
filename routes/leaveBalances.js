// routes/leaveBalances.js
import { Router } from "express";
import pool from "../config/db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

function balanceKey(name, id) {
  return String(name ?? id).trim().toLowerCase();
}

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

  const grouped = new Map();
  rows.forEach((row) => {
    const totalDays = Number(row.total_days ?? row.default_max ?? 0);
    const usedDays = Number(row.used_days ?? 0);
    const key = balanceKey(row.name, row.leave_type_id);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        leave_type_id: row.leave_type_id,
        name: row.name,
        total_days: totalDays,
        used_days: usedDays,
      });
      return;
    }

    existing.leave_type_id = Math.min(existing.leave_type_id, row.leave_type_id);
    existing.total_days = Math.max(existing.total_days, totalDays);
    existing.used_days += usedDays;
  });

  return Array.from(grouped.values())
    .map((balance) => ({
      ...balance,
      used_days: Number(balance.used_days.toFixed(2)),
      remaining: Math.max(0, Number((balance.total_days - balance.used_days).toFixed(2))),
    }))
    .sort((a, b) => a.leave_type_id - b.leave_type_id);
}

// GET /api/leave-balances?year=2026 - pool รวมของ user ที่ login พร้อม balances แยกตามประเภท
router.get("/", authenticate, async (req, res, next) => {
  try {
    const year = Number(req.query.year || new Date().getFullYear());
    const [balances, [rows]] = await Promise.all([
      getBalancesByType(req.user.id, year),
      pool.query(
        `SELECT * FROM user_leave_pool
         WHERE user_id = ? AND year = ?
         LIMIT 1`,
        [req.user.id, year]
      ),
    ]);

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

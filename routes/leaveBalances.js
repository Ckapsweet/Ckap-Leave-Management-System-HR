// routes/leaveBalances.js
import { Router } from "express";
import pool from "../config/db.js";
import { authenticate } from "../middleware/auth.js";
import { calculateLeaveHours, leaveHoursToDays } from "../services/leaveTime.js";

const router = Router();

function balanceKey(name, id) {
  return String(name ?? id).trim().toLowerCase();
}

function yearBounds(year) {
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear) || numericYear < 1000 || numericYear > 9999) return null;
  return [`${numericYear}-01-01`, `${numericYear + 1}-01-01`];
}

function getLeaveDaysFromRow(row) {
  if (row.start_time && row.end_time) {
    return leaveHoursToDays(calculateLeaveHours(row.start_time, row.end_time));
  }
  return Number(row.total_days ?? 0);
}

async function getBalancesByType(userId, year) {
  const range = yearBounds(year);
  const [[rows], [approvedRows]] = await Promise.all([
    pool.query(
    `SELECT lt.id AS leave_type_id, lt.name, lt.max_days AS default_max,
            lb.total_days, lb.used_days
     FROM leave_types lt
     LEFT JOIN leave_balances lb
       ON lb.leave_type_id = lt.id
      AND lb.user_id = ?
      AND lb.year = ?
     ORDER BY lt.id ASC`,
    [userId, year]
    ),
    range
      ? pool.query(
          `SELECT lr.leave_type_id, lt.name, lr.start_time, lr.end_time, lr.total_days
           FROM leave_requests lr
           JOIN leave_types lt ON lt.id = lr.leave_type_id
           WHERE lr.user_id = ? AND lr.status = 'approved'
             AND lr.start_date >= ? AND lr.start_date < ?`,
          [userId, ...range]
        )
      : Promise.resolve([[]]),
  ]);

  const usedByType = approvedRows.reduce((acc, row) => {
    const key = balanceKey(row.name, row.leave_type_id);
    acc[key] = (acc[key] ?? 0) + getLeaveDaysFromRow(row);
    return acc;
  }, {});
  const usagePartsByType = approvedRows.reduce((acc, row) => {
    const key = balanceKey(row.name, row.leave_type_id);
    const current = acc[key] ?? { used_day_units: 0, used_hours: 0 };
    if (row.start_time && row.end_time) {
      current.used_hours += calculateLeaveHours(row.start_time, row.end_time);
    } else {
      current.used_day_units += Number(row.total_days ?? 0);
    }
    acc[key] = current;
    return acc;
  }, {});

  const grouped = new Map();
  rows.forEach((row) => {
    const totalDays = Number(row.total_days ?? row.default_max ?? 0);
    const key = balanceKey(row.name, row.leave_type_id);
    const usedDays = Number(Number(usedByType[key] ?? row.used_days ?? 0).toFixed(2));
    const usageParts = usagePartsByType[key] ?? { used_day_units: usedDays, used_hours: 0 };
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        leave_type_id: row.leave_type_id,
        name: row.name,
        total_days: totalDays,
        used_days: usedDays,
        used_day_units: Number(usageParts.used_day_units.toFixed(2)),
        used_hours: Number(usageParts.used_hours.toFixed(2)),
      });
      return;
    }

    existing.leave_type_id = Math.min(existing.leave_type_id, row.leave_type_id);
    existing.total_days = Math.max(existing.total_days, totalDays);
    existing.used_days += usedDays;
    existing.used_day_units += usageParts.used_day_units;
    existing.used_hours += usageParts.used_hours;
  });

  return Array.from(grouped.values())
    .map((balance) => ({
      ...balance,
      used_days: Number(balance.used_days.toFixed(2)),
      used_day_units: Number((balance.used_day_units ?? 0).toFixed(2)),
      used_hours: Number((balance.used_hours ?? 0).toFixed(2)),
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
      const usedDayUnits = balances.reduce((sum, balance) => sum + (balance.used_day_units ?? 0), 0);
      const usedHours = balances.reduce((sum, balance) => sum + (balance.used_hours ?? 0), 0);

      return res.json({
        id: null,
        user_id: req.user.id,
        total_days: totalDays,
        used_days: usedDays,
        used_day_units: Number(usedDayUnits.toFixed(2)),
        used_hours: Number(usedHours.toFixed(2)),
        remaining: Math.max(0, totalDays - usedDays),
        year,
        balances,
      });
    }

    const r = rows[0];
    res.json({
      ...r,
      used_day_units: Number(balances.reduce((sum, balance) => sum + (balance.used_day_units ?? 0), 0).toFixed(2)),
      used_hours: Number(balances.reduce((sum, balance) => sum + (balance.used_hours ?? 0), 0).toFixed(2)),
      remaining: Math.max(0, r.total_days - r.used_days),
      balances,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

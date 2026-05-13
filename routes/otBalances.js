// routes/otBalances.js
import { Router } from "express";
import pool from "../config/db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

function yearBounds(year) {
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear) || numericYear < 1000 || numericYear > 9999) return null;
  return [`${numericYear}-01-01`, `${numericYear + 1}-01-01`];
}

router.get("/", authenticate, async (req, res, next) => {
  try {
    const year = req.query.year ?? new Date().getFullYear();
    const range = yearBounds(year);
    if (!range) return res.status(400).json({ message: "year ไม่ถูกต้อง" });
    const [rows] = await pool.query(
      `SELECT SUM(total_hours) AS used_hours
       FROM ot_requests
       WHERE user_id = ? 
         AND ot_date >= ?
         AND ot_date < ?
         AND status = 'approved'`,
      [req.user.id, ...range]
    );

    const used_hours = parseFloat(rows[0]?.used_hours || 0);
    const total_hours = 36; // สมมติโควตาเบื้องต้น 36 (ตาม MockData) 
    const remaining = total_hours - used_hours;

    res.json({
      user_id: req.user.id,
      total_hours,
      used_hours,
      remaining: Math.max(0, remaining),
      year: Number(year)
    });
  } catch (err) { next(err); }
});

export default router;

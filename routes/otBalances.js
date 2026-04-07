// routes/otBalances.js
import { Router } from "express";
import pool from "../config/db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, async (req, res, next) => {
  try {
    const year = req.query.year ?? new Date().getFullYear();
    const [rows] = await pool.query(
      `SELECT SUM(total_hours) AS used_hours
       FROM ot_requests
       WHERE user_id = ? 
         AND YEAR(ot_date) = ? 
         AND status = 'approved'`,
      [req.user.id, year]
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

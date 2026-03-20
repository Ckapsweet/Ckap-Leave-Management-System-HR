// routes/leaveBalances.js
import { Router } from "express";
import pool from "../config/db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// GET /api/leave-balances?year=2025  — วันลาคงเหลือของ user ที่ login
router.get("/", authenticate, async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getFullYear();

    const [rows] = await pool.query(
      `SELECT
         lb.*,
         lt.name        AS leave_type_name,
         lt.description AS leave_type_description,
         lt.max_days    AS leave_type_max_days
       FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE lb.user_id = ? AND lb.year = ?
       ORDER BY lb.leave_type_id ASC`,
      [req.user.id, year]
    );

    const data = rows.map((r) => ({
      ...r,
      leave_type: {
        id:          r.leave_type_id,
        name:        r.leave_type_name,
        description: r.leave_type_description,
        max_days:    r.leave_type_max_days,
      },
    }));

    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
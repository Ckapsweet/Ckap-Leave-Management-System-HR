// routes/leaveTypes.js
import { Router } from "express";
import pool from "../config/db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

function uniqueByName(rows) {
  const byName = new Map();
  rows.forEach((row) => {
    const key = String(row.name ?? row.id).trim().toLowerCase();
    if (!byName.has(key)) byName.set(key, row);
  });
  return Array.from(byName.values());
}

// GET /api/leave-types
router.get("/", authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM leave_types ORDER BY id ASC"
    );
    res.json(uniqueByName(rows));
  } catch (err) {
    next(err);
  }
});

// GET /api/leave-types/:id
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM leave_types WHERE id = ? LIMIT 1",
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "ไม่พบประเภทการลา" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;

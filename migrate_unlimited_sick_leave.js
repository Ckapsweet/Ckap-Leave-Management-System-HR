import pool from "./config/db.js";

async function migrate() {
  const sickWhere = "LOWER(TRIM(name)) IN ('sick', 'sick leave') OR name LIKE '%ลาป่วย%'";
  await pool.query(`UPDATE leave_types SET max_days = 0 WHERE ${sickWhere}`);
  await pool.query(`
    UPDATE leave_balances lb
    JOIN leave_types lt ON lt.id = lb.leave_type_id
    SET lb.total_days = 0
    WHERE LOWER(TRIM(lt.name)) IN ('sick', 'sick leave') OR lt.name LIKE '%ลาป่วย%'
  `);
  await pool.query(`
    UPDATE user_leave_pool ulp
    JOIN (
      SELECT user_id, year, COALESCE(SUM(total_days), 0) AS total_days
      FROM leave_balances
      GROUP BY user_id, year
    ) totals ON totals.user_id = ulp.user_id AND totals.year = ulp.year
    SET ulp.total_days = totals.total_days
  `);
  console.log("Configured sick leave as unlimited while preserving used leave history");
  await pool.end();
}

migrate().catch(async (err) => {
  console.error("Migration failed:", err);
  await pool.end();
  process.exit(1);
});

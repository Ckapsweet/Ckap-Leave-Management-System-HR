import pool from "./config/db.js";

async function migrate() {
  await pool.query(
    `ALTER TABLE leave_balances
       MODIFY total_days DECIMAL(10,6) DEFAULT NULL,
       MODIFY used_days DECIMAL(10,6) DEFAULT 0.000000`
  );
  await pool.query(
    `ALTER TABLE user_leave_pool
       MODIFY total_days DECIMAL(10,6) NOT NULL DEFAULT 0.000000,
       MODIFY used_days DECIMAL(10,6) NOT NULL DEFAULT 0.000000`
  );
  await pool.query(
    "ALTER TABLE leave_requests MODIFY total_days DECIMAL(10,6) DEFAULT NULL"
  );
  console.log("Aligned leave totals with minute-precision decimal days");
  await pool.end();
}

migrate().catch(async (err) => {
  console.error("Migration failed:", err);
  await pool.end();
  process.exit(1);
});

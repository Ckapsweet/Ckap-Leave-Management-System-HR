import pool from "./config/db.js";

async function migrate() {
  await pool.query(
    "ALTER TABLE leave_balances MODIFY total_days DECIMAL(6,2) DEFAULT NULL, MODIFY used_days DECIMAL(6,2) DEFAULT 0.00"
  );
  console.log("Aligned leave_balances totals with decimal leave days");
  await pool.end();
}

migrate().catch(async (err) => {
  console.error("Migration failed:", err);
  await pool.end();
  process.exit(1);
});

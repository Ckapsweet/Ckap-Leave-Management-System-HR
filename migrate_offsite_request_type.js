import "dotenv/config";
import pool from "./config/db.js";

async function columnExists(tableName, columnName) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function main() {
  if (await columnExists("leave_requests", "request_type")) {
    await pool.query(
      "ALTER TABLE leave_requests MODIFY request_type ENUM('leave','late','offsite') NOT NULL DEFAULT 'leave'"
    );
    console.log("Aligned leave_requests.request_type enum with offsite");
  }

  await pool.query(
    `INSERT INTO leave_types (name, description, max_days)
     SELECT ?, ?, ?
     WHERE NOT EXISTS (
       SELECT 1 FROM leave_types
       WHERE LOWER(name) IN ('offsite', 'work outside')
          OR name = ?
       LIMIT 1
     )`,
    ["ทำงานนอกสถานที่", "คำขอทำงานนอกสถานที่ ไม่หักสิทธิ์วันลา", 0, "ทำงานนอกสถานที่"]
  );
  console.log("Ensured offsite leave type");
}

main()
  .then(async () => {
    await pool.end();
    console.log("Migration completed");
  })
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });

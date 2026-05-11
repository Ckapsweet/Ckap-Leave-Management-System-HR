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

async function tableExists(tableName) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
     LIMIT 1`,
    [tableName]
  );
  return rows.length > 0;
}

async function main() {
  if (!(await columnExists("leave_requests", "request_type"))) {
    await pool.query(
      "ALTER TABLE leave_requests ADD COLUMN request_type ENUM('leave','late') NOT NULL DEFAULT 'leave' AFTER total_days"
    );
    console.log("Added leave_requests.request_type");
  }

  if (!(await tableExists("leave_request_attachments"))) {
    await pool.query(`
      CREATE TABLE leave_request_attachments (
        id INT NOT NULL AUTO_INCREMENT,
        leave_request_id INT NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        stored_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY leave_request_id (leave_request_id),
        CONSTRAINT leave_request_attachments_ibfk_1
          FOREIGN KEY (leave_request_id) REFERENCES leave_requests (id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("Created leave_request_attachments");
  }
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

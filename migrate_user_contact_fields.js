import pool from "./config/db.js";

async function columnExists(columnName) {
  const [rows] = await pool.query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [columnName]
  );
  return rows.length > 0;
}

async function addColumnIfMissing(columnName, definition) {
  if (await columnExists(columnName)) {
    console.log(`Column users.${columnName} already exists`);
    return;
  }
  await pool.query(`ALTER TABLE users ADD COLUMN ${definition}`);
  console.log(`Added users.${columnName}`);
}

async function migrate() {
  await addColumnIfMissing("email", "email VARCHAR(255) NULL AFTER supervisor_id");
  await addColumnIfMissing("email_2", "email_2 VARCHAR(255) NULL AFTER email");
  await addColumnIfMissing("phone", "phone VARCHAR(50) NULL AFTER email_2");
  await pool.end();
}

migrate().catch(async (err) => {
  console.error("Migration failed:", err);
  await pool.end();
  process.exit(1);
});

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

async function migrate() {
  if (!(await columnExists("english_name"))) {
    await pool.query("ALTER TABLE users ADD COLUMN english_name VARCHAR(255) NULL AFTER full_name");
    console.log("Added users.english_name");
  } else {
    console.log("Column users.english_name already exists");
  }

  await pool.query("ALTER TABLE users MODIFY english_name VARCHAR(255) NULL");
  console.log("Aligned users english_name with backend schema");
  await pool.end();
}

migrate().catch(async (err) => {
  console.error("Migration failed:", err);
  await pool.end();
  process.exit(1);
});

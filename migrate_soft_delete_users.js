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

async function indexExists(indexName) {
  const [rows] = await pool.query(
    `
      SELECT INDEX_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND INDEX_NAME = ?
      LIMIT 1
    `,
    [indexName]
  );
  return rows.length > 0;
}

async function migrate() {
  const hasIsActive = await columnExists("is_active");
  if (hasIsActive) {
    console.log("Column users.is_active already exists");
  } else {
    await pool.query("ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER phone");
    console.log("Added users.is_active soft-delete column");
  }

  if (await indexExists("idx_users_is_active")) {
    console.log("Index idx_users_is_active already exists");
  } else {
    await pool.query("CREATE INDEX idx_users_is_active ON users (is_active)");
    console.log("Added idx_users_is_active index");
  }

  await pool.end();
}

migrate().catch(async (err) => {
  console.error("Migration failed:", err);
  await pool.end();
  process.exit(1);
});

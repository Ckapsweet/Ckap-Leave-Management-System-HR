import pool from "./config/db.js";

async function migrate() {
  await pool.query(
    "ALTER TABLE users MODIFY role ENUM('user','lead','assistant manager','manager','hr','admin') NOT NULL DEFAULT 'user'"
  );
  console.log("Aligned users.role enum with HR role");
  await pool.end();
}

migrate().catch(async (err) => {
  console.error("Migration failed:", err);
  await pool.end();
  process.exit(1);
});

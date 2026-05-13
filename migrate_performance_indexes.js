import pool from "./config/db.js";

async function indexExists(conn, tableName, indexName) {
  const [rows] = await conn.query(
    `
      SELECT INDEX_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
      LIMIT 1
    `,
    [tableName, indexName]
  );
  return rows.length > 0;
}

async function addIndex(conn, tableName, indexName, sql) {
  if (await indexExists(conn, tableName, indexName)) {
    console.log(`Index ${indexName} already exists`);
    return;
  }
  await conn.query(sql);
  console.log(`Added ${indexName}`);
}

async function dedupeLeaveBalances(conn) {
  await conn.query(`
    CREATE TEMPORARY TABLE tmp_leave_balance_rollup AS
    SELECT
      MIN(id) AS keep_id,
      user_id,
      leave_type_id,
      year,
      MAX(total_days) AS total_days,
      SUM(used_days) AS used_days
    FROM leave_balances
    GROUP BY user_id, leave_type_id, year
  `);

  await conn.query(`
    UPDATE leave_balances lb
    JOIN tmp_leave_balance_rollup rollup ON rollup.keep_id = lb.id
    SET lb.total_days = rollup.total_days,
        lb.used_days = rollup.used_days
  `);

  await conn.query(`
    DELETE lb
    FROM leave_balances lb
    LEFT JOIN tmp_leave_balance_rollup rollup ON rollup.keep_id = lb.id
    WHERE rollup.keep_id IS NULL
  `);
}

async function migrate() {
  const conn = await pool.getConnection();
  try {
    await dedupeLeaveBalances(conn);

    await addIndex(
    conn,
    "leave_balances",
    "uq_leave_balances_user_type_year",
    "ALTER TABLE leave_balances ADD UNIQUE KEY uq_leave_balances_user_type_year (user_id, leave_type_id, year)"
  );

    await addIndex(
    conn,
    "leave_requests",
    "idx_leave_requests_user_created",
    "CREATE INDEX idx_leave_requests_user_created ON leave_requests (user_id, created_at)"
  );
    await addIndex(
    conn,
    "leave_requests",
    "idx_leave_requests_user_status_start",
    "CREATE INDEX idx_leave_requests_user_status_start ON leave_requests (user_id, status, start_date)"
  );
    await addIndex(
    conn,
    "leave_requests",
    "idx_leave_requests_status_start_end",
    "CREATE INDEX idx_leave_requests_status_start_end ON leave_requests (status, start_date, end_date)"
  );
    await addIndex(
    conn,
    "leave_requests",
    "idx_leave_requests_assignee",
    "CREATE INDEX idx_leave_requests_assignee ON leave_requests (current_assignee_id)"
  );

    await addIndex(
    conn,
    "ot_requests",
    "idx_ot_requests_user_created",
    "CREATE INDEX idx_ot_requests_user_created ON ot_requests (user_id, created_at)"
  );
    await addIndex(
    conn,
    "ot_requests",
    "idx_ot_requests_user_status_date",
    "CREATE INDEX idx_ot_requests_user_status_date ON ot_requests (user_id, status, ot_date)"
  );
    await addIndex(
    conn,
    "ot_requests",
    "idx_ot_requests_user_date_time",
    "CREATE INDEX idx_ot_requests_user_date_time ON ot_requests (user_id, ot_date, start_time, end_time)"
  );
    await addIndex(
    conn,
    "ot_requests",
    "idx_ot_requests_status_date",
    "CREATE INDEX idx_ot_requests_status_date ON ot_requests (status, ot_date)"
  );
    await addIndex(
    conn,
    "ot_requests",
    "idx_ot_requests_assignee",
    "CREATE INDEX idx_ot_requests_assignee ON ot_requests (current_assignee_id)"
  );

    await addIndex(
    conn,
    "users",
    "idx_users_department_active_role",
    "CREATE INDEX idx_users_department_active_role ON users (department, is_active, role)"
  );
    await addIndex(
    conn,
    "users",
    "idx_users_role_department_active",
    "CREATE INDEX idx_users_role_department_active ON users (role, department, is_active)"
  );
    await addIndex(
    conn,
    "users",
    "idx_users_employee_active",
    "CREATE INDEX idx_users_employee_active ON users (employee_code, is_active)"
  );

    conn.release();
    await pool.end();
  } catch (err) {
    conn.release();
    throw err;
  }
}

migrate().catch(async (err) => {
  console.error("Migration failed:", err);
  await pool.end();
  process.exit(1);
});

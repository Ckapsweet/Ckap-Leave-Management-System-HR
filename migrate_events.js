import pool from "./config/db.js";

async function migrateEvents() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id int(11) NOT NULL AUTO_INCREMENT,
      title varchar(255) NOT NULL,
      description text DEFAULT NULL,
      start_date date NOT NULL,
      end_date date NOT NULL,
      created_by int(11) NOT NULL,
      lead_id int(11) NOT NULL,
      department varchar(255) DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      KEY idx_events_lead (lead_id),
      KEY idx_events_creator (created_by),
      KEY idx_events_department_dates (department, start_date, end_date),
      CONSTRAINT events_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id),
      CONSTRAINT events_lead_fk FOREIGN KEY (lead_id) REFERENCES users (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_participants (
      id int(11) NOT NULL AUTO_INCREMENT,
      event_id int(11) NOT NULL,
      user_id int(11) NOT NULL,
      selected_by_lead_id int(11) DEFAULT NULL,
      selected_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_event_user (event_id, user_id),
      KEY idx_event_participants_user (user_id),
      KEY idx_event_participants_lead (selected_by_lead_id),
      CONSTRAINT event_participants_event_fk FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
      CONSTRAINT event_participants_user_fk FOREIGN KEY (user_id) REFERENCES users (id),
      CONSTRAINT event_participants_lead_fk FOREIGN KEY (selected_by_lead_id) REFERENCES users (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_external_participants (
      id int(11) NOT NULL AUTO_INCREMENT,
      event_id int(11) NOT NULL,
      full_name varchar(255) NOT NULL,
      department varchar(255) DEFAULT 'บุคคลอื่นๆ',
      created_by int(11) DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_event_external_name (event_id, full_name),
      KEY idx_event_external_participants_event (event_id),
      KEY idx_event_external_participants_creator (created_by),
      CONSTRAINT event_external_participants_event_fk FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
      CONSTRAINT event_external_participants_creator_fk FOREIGN KEY (created_by) REFERENCES users (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_leads (
      id int(11) NOT NULL AUTO_INCREMENT,
      event_id int(11) NOT NULL,
      lead_id int(11) NOT NULL,
      assigned_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_event_lead (event_id, lead_id),
      KEY idx_event_leads_lead (lead_id),
      CONSTRAINT event_leads_event_fk FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
      CONSTRAINT event_leads_lead_fk FOREIGN KEY (lead_id) REFERENCES users (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    INSERT IGNORE INTO event_leads (event_id, lead_id)
    SELECT id, lead_id
    FROM events
    WHERE lead_id IS NOT NULL
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_time_logs (
      id int(11) NOT NULL AUTO_INCREMENT,
      event_id int(11) NOT NULL,
      user_id int(11) NOT NULL,
      event_date date NOT NULL,
      check_in_at datetime DEFAULT NULL,
      check_out_at datetime DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_event_time_user_date (event_id, user_id, event_date),
      KEY idx_event_time_logs_user (user_id),
      CONSTRAINT event_time_logs_event_fk FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
      CONSTRAINT event_time_logs_user_fk FOREIGN KEY (user_id) REFERENCES users (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [[eventDateColumn]] = await pool.query(`
    SELECT COUNT(*) AS count
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'event_time_logs'
      AND COLUMN_NAME = 'event_date'
  `);
  if (!eventDateColumn.count) {
    await pool.query("ALTER TABLE event_time_logs ADD COLUMN event_date date NULL AFTER user_id");
    await pool.query(`
      UPDATE event_time_logs etl
      JOIN events e ON e.id = etl.event_id
      SET etl.event_date = e.start_date
      WHERE etl.event_date IS NULL
    `);
    await pool.query("ALTER TABLE event_time_logs MODIFY event_date date NOT NULL");
  }

  const [indexes] = await pool.query(`
    SELECT INDEX_NAME
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'event_time_logs'
      AND INDEX_NAME IN ('uq_event_time_user', 'uq_event_time_user_date')
    GROUP BY INDEX_NAME
  `);
  const indexNames = new Set(indexes.map((row) => row.INDEX_NAME));
  if (!indexNames.has("uq_event_time_user_date")) {
    await pool.query("ALTER TABLE event_time_logs ADD UNIQUE KEY uq_event_time_user_date (event_id, user_id, event_date)");
  }
  if (indexNames.has("uq_event_time_user")) {
    await pool.query("ALTER TABLE event_time_logs DROP INDEX uq_event_time_user");
  }

  const ensureColumn = async (columnName, ddl) => {
    const [[row]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'event_time_logs'
         AND COLUMN_NAME = ?`,
      [columnName]
    );
    if (!row.count) await pool.query(ddl);
  };

  await ensureColumn("check_in_time", "ALTER TABLE event_time_logs ADD COLUMN check_in_time time DEFAULT NULL AFTER event_date");
  await ensureColumn("check_out_time", "ALTER TABLE event_time_logs ADD COLUMN check_out_time time DEFAULT NULL AFTER check_in_time");
  await ensureColumn("external_participant_id", "ALTER TABLE event_time_logs ADD COLUMN external_participant_id int(11) DEFAULT NULL AFTER user_id");
  await ensureColumn("status", "ALTER TABLE event_time_logs ADD COLUMN status enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft' AFTER check_out_at");
  await ensureColumn("approved_by", "ALTER TABLE event_time_logs ADD COLUMN approved_by int(11) DEFAULT NULL AFTER status");
  await ensureColumn("approved_at", "ALTER TABLE event_time_logs ADD COLUMN approved_at datetime DEFAULT NULL AFTER approved_by");
  await ensureColumn("approval_comment", "ALTER TABLE event_time_logs ADD COLUMN approval_comment text DEFAULT NULL AFTER approved_at");

  const [[userIdNullable]] = await pool.query(`
    SELECT IS_NULLABLE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'event_time_logs'
      AND COLUMN_NAME = 'user_id'
  `);
  if (userIdNullable?.IS_NULLABLE === "NO") {
    await pool.query("ALTER TABLE event_time_logs MODIFY user_id int(11) DEFAULT NULL");
  }

  const [timeLogIndexes] = await pool.query(`
    SELECT INDEX_NAME
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'event_time_logs'
      AND INDEX_NAME IN ('uq_event_time_external_date', 'idx_event_time_logs_external_participant')
    GROUP BY INDEX_NAME
  `);
  const timeLogIndexNames = new Set(timeLogIndexes.map((row) => row.INDEX_NAME));
  if (!timeLogIndexNames.has("uq_event_time_external_date")) {
    await pool.query("ALTER TABLE event_time_logs ADD UNIQUE KEY uq_event_time_external_date (event_id, external_participant_id, event_date)");
  }
  if (!timeLogIndexNames.has("idx_event_time_logs_external_participant")) {
    await pool.query("ALTER TABLE event_time_logs ADD KEY idx_event_time_logs_external_participant (external_participant_id)");
  }

  const [timeLogConstraints] = await pool.query(`
    SELECT CONSTRAINT_NAME
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'event_time_logs'
      AND CONSTRAINT_NAME = 'event_time_logs_external_participant_fk'
  `);
  if (!timeLogConstraints.length) {
    await pool.query(`
      ALTER TABLE event_time_logs
      ADD CONSTRAINT event_time_logs_external_participant_fk
      FOREIGN KEY (external_participant_id) REFERENCES event_external_participants (id) ON DELETE CASCADE
    `);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_time_attachments (
      id int(11) NOT NULL AUTO_INCREMENT,
      event_time_log_id int(11) NOT NULL,
      original_name varchar(255) NOT NULL,
      stored_name varchar(255) NOT NULL,
      mime_type varchar(100) NOT NULL,
      size int(11) NOT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      KEY idx_event_time_attachments_log (event_time_log_id),
      CONSTRAINT event_time_attachments_log_fk FOREIGN KEY (event_time_log_id) REFERENCES event_time_logs (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [[evidenceTypeColumn]] = await pool.query(`
    SELECT COUNT(*) AS count
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'event_time_attachments'
      AND COLUMN_NAME = 'evidence_type'
  `);
  if (!evidenceTypeColumn.count) {
    await pool.query("ALTER TABLE event_time_attachments ADD COLUMN evidence_type enum('check_in','check_out') NOT NULL DEFAULT 'check_in' AFTER event_time_log_id");
  }
}

migrateEvents()
  .then(() => {
    console.log("Event tables migrated");
    return pool.end();
  })
  .catch(async (err) => {
    console.error("Event migration failed:", err);
    await pool.end();
    process.exit(1);
  });

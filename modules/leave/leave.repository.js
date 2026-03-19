import db from "../../config/db.js";

export const getLeaveBalance = async (userId, typeId, conn) => {
  const [rows] = await conn.execute(
    `SELECT * FROM leave_balances 
     WHERE user_id=? AND leave_type_id=? FOR UPDATE`,
    [userId, typeId]
  );
  return rows[0];
};

export const insertLeave = async (data, conn) => {
  const [result] = await conn.execute(
    `INSERT INTO leave_requests
    (user_id, leave_type_id, start_date, end_date, total_days, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    data
  );
  return result.insertId;
};
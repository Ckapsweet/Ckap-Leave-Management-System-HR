import db from "../../config/db.js";
import { getLeaveBalance, insertLeave } from "./leave.repository.js";

export const createLeaveService = async (user, body) => {
  const conn = await db.getConnection();

  try {
    const { leave_type_id, start_date, end_date, reason } = body;

    const total_days =
      (new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24) + 1;

    await conn.beginTransaction();

    const balance = await getLeaveBalance(user.id, leave_type_id, conn);

    if (!balance) throw new Error("No balance");

    const remain = balance.total_days - balance.used_days;

    if (total_days > remain) throw new Error("Leave exceeded");

    const id = await insertLeave(
      [user.id, leave_type_id, start_date, end_date, total_days, reason],
      conn
    );

    await conn.commit();

    return { id };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
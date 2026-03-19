import db from "../../config/db.js";

export const findUserByEmployeeCode = async (employee_code) => {
  const [rows] = await db.execute(
    "SELECT * FROM users WHERE employee_code=?",
    [employee_code]
  );
  return rows[0];
};
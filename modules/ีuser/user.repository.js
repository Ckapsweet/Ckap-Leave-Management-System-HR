import db from "../../config/db.js";

export const createUserRepo = async (user) => {
  const [r] = await db.execute(
    "INSERT INTO users (employee_code, full_name, password, role) VALUES (?, ?, ?, ?)",
    [user.employee_code, user.full_name, user.password, user.role]
  );
  return r.insertId;
};

export const getAllUsersRepo = async () => {
  const [rows] = await db.execute(
    "SELECT id, employee_code, full_name, role FROM users"
  );
  return rows;
};

export const updateUserRepo = async (id, data) => {
  const keys = Object.keys(data);
  const values = Object.values(data);

  const set = keys.map((k) => `${k}=?`).join(", ");

  await db.execute(`UPDATE users SET ${set} WHERE id=?`, [...values, id]);
};

export const deleteUserRepo = async (id) => {
  await db.execute("DELETE FROM users WHERE id=?", [id]);
};
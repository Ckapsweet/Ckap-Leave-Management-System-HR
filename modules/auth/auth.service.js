import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findUserByEmployeeCode } from "./auth.repository.js";

export const loginService = async (employee_code, password) => {
  const user = await findUserByEmployeeCode(employee_code);

  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid password");

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      employee_code: user.employee_code,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return {
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      role: user.role,
    },
  };
};
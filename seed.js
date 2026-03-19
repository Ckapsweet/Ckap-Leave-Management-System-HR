import db from "./config/db.js";
import bcrypt from "bcryptjs";

const run = async () => {
  const hash = await bcrypt.hash("password123", 10);

  await db.execute(
    "INSERT INTO users (employee_code, full_name, password, role) VALUES (?, ?, ?, ?)",
    ["EMP001", "Test User", hash, "user"]
  );

  await db.execute(
    "INSERT INTO users (employee_code, full_name, password, role) VALUES (?, ?, ?, ?)",
    ["HR001", "HR User", hash, "hr"]
  );

  console.log("Seed success");
};

run();
import { loginService } from "./auth.service.js";

export const login = async (req, res) => {
  try {
    const { employee_code, password } = req.body;
    const result = await loginService(employee_code, password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
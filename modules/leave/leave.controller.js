import { createLeaveService } from "./leave.service.js";

export const createLeave = async (req, res) => {
  try {
    const result = await createLeaveService(req.user, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
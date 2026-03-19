import express from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import { authorizeRoles, ROLES } from "../../middleware/role.middleware.js";

import { createLeave } from "./leave.controller.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  authorizeRoles(ROLES.USER),
  createLeave
);

export default router;
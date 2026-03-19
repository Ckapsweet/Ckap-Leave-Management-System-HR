import express from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import { authorizeRoles, ROLES } from "../../middleware/role.middleware.js";

import {
  createLeave,
  getMyLeaves,
  getAllLeaves,
} from "./leave.controller.js";

const router = express.Router();

router.post("/create", authMiddleware, authorizeRoles(ROLES.USER), createLeave);
router.get("/my", authMiddleware, authorizeRoles(ROLES.USER), getMyLeaves);
router.get("/all", authMiddleware, authorizeRoles(ROLES.HR), getAllLeaves);

export default router;
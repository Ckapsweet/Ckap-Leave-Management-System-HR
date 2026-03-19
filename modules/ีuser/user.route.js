import express from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import { authorizeRoles, ROLES } from "../../middleware/role.middleware.js";

import {
  createUser,
  getAllUsers,
  updateUser,
  deleteUser,
  updateMyProfile,
} from "./user.controller.js";

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles(ROLES.HR), createUser);
router.get("/", authMiddleware, authorizeRoles(ROLES.HR), getAllUsers);

router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(ROLES.USER, ROLES.HR),
  updateUser
);

router.put("/me", authMiddleware, updateMyProfile);

router.delete("/:id", authMiddleware, authorizeRoles(ROLES.HR), deleteUser);

export default router;
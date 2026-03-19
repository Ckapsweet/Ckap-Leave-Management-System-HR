import {
  createUserService,
  getAllUsersService,
  updateUserService,
  deleteUserService,
} from "./user.service.js";

export const createUser = async (req, res) => {
  const result = await createUserService(req.body);
  res.json(result);
};

export const getAllUsers = async (req, res) => {
  res.json(await getAllUsersService());
};

export const updateUser = async (req, res) => {
  const result = await updateUserService(
    req.user,
    req.params.id,
    req.body
  );
  res.json(result);
};

export const updateMyProfile = async (req, res) => {
  const result = await updateUserService(
    req.user,
    req.user.id,
    req.body
  );
  res.json(result);
};

export const deleteUser = async (req, res) => {
  await deleteUserService(req.params.id);
  res.json({ message: "Deleted" });
};
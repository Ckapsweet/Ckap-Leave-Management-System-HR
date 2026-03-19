import bcrypt from "bcryptjs";
import {
  createUserRepo,
  getAllUsersRepo,
  updateUserRepo,
  deleteUserRepo,
} from "./user.repository.js";

export const createUserService = async (data) => {
  const hash = await bcrypt.hash(data.password, 10);
  const id = await createUserRepo({ ...data, password: hash });
  return { id };
};

export const getAllUsersService = async () => {
  return await getAllUsersRepo();
};

export const updateUserService = async (currentUser, id, data) => {
  if (currentUser.role === "user" && currentUser.id != id) {
    throw new Error("Forbidden");
  }

  if (currentUser.role === "user") {
    delete data.role;
  }

  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  await updateUserRepo(id, data);
  return { message: "Updated" };
};

export const deleteUserService = async (id) => {
  await deleteUserRepo(id);
};
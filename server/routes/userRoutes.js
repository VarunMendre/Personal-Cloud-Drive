import express from "express";
import checkAuth, {
  checkIsAdminUser,
  checkIsOwner,
  checkNotRegularUser,
  checkUserDeleted,
} from "../middlewares/authMiddleware.js";
import {
  getAllUsers,
  getCurrentUser,
  hardDeleteUser,
  login,
  logout,
  logoutAll,
  logOutById,
  recoverUser,
  register,
  softDeleteUser,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/user", checkAuth, checkUserDeleted, getCurrentUser);
router.post("/user/register", checkUserDeleted, register);
router.post("/user/login", checkUserDeleted, login);

router.post("/user/logout", logout);
router.post("/user/logout-all", logoutAll);

router.get(
  "/users",
  checkAuth,
  checkUserDeleted,
  checkNotRegularUser,
  getAllUsers
);

router.post(
  "/users/:userId/logout",
  checkAuth,
  checkUserDeleted,
  checkNotRegularUser,
  logOutById
);

router.delete(
  "/users/:userId",
  checkAuth,
  checkUserDeleted,
  softDeleteUser
);

router.delete(
  "/users/:userId/hard",
  checkAuth,
  checkUserDeleted,
  checkIsOwner,
  checkIsAdminUser,
  hardDeleteUser
);

router.put("/users/:userId/recover", checkAuth, checkIsOwner, recoverUser);
export default router;

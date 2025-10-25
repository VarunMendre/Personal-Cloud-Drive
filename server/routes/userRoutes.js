import express from "express";
import checkAuth, {
  checkIsAdminUser,
  checkNotRegularUser,
  checkUserDeleted,
} from "../middlewares/authMiddleware.js";
import {
  deleteUser,
  getAllUsers,
  getCurrentUser,
  login,
  logout,
  logoutAll,
  logOutById,
  register,
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
  checkIsAdminUser,
  deleteUser
);
export default router;

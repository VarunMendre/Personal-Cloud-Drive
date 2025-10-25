import express from "express";
import checkAuth, {
  checkIsAdminUser,
  checkNotRegularUser,
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

router.get("/user", checkAuth, getCurrentUser);
router.post("/user/register", register);
router.post("/user/login", login);

router.post("/user/logout", logout);
router.post("/user/logout-all", logoutAll);

router.get("/users", checkAuth, checkNotRegularUser, getAllUsers);
router.post("/users/:userId/logout", checkAuth, checkNotRegularUser, logOutById);

router.delete("/users/:userId", checkAuth, checkIsAdminUser , deleteUser);
export default router;

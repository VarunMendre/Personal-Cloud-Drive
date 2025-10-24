import express from "express";
import checkAuth, {
  checkNotRegularUser,
} from "../middlewares/authMiddleware.js";
import {
  getAllUsers,
  getCurrentUser,
  login,
  logout,
  logoutAll,
  logOutById,
  register,
} from "../controllers/userController.js";
import Session from "../models/sessionModel.js";

const router = express.Router();

router.post("/user/register", register);

router.post("/user/login", login);

router.get("/user", checkAuth, getCurrentUser);
router.get("/users", checkAuth, checkNotRegularUser, getAllUsers);

router.post("/user/logout", logout);
router.post("/user/logout-all", logoutAll);

router.post("/users/:userId/logout", checkAuth, checkNotRegularUser, logOutById);

export default router;

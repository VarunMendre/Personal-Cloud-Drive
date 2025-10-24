import express from "express";
import checkAuth from "../middlewares/authMiddleware.js";
import {
  getAllUsers,
  getCurrentUser,
  login,
  logout,
  logoutAll,
  register,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/user/register", register);

router.post("/user/login", login);

router.get("/user", checkAuth, getCurrentUser);
router.get("/users", checkAuth, (req, res, next) => {
  if (req.user.role !== "User") return next();
  res.status(403).json({ error: "Users are restricted to access this page" });
}, getAllUsers);

router.post("/user/logout", logout);
router.post("/user/logout-all", logoutAll);


export default router;

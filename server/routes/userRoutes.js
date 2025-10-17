import express from "express";
import checkAuth from "../middlewares/authMiddleware.js";
import { getCurrentUser, logout, login, register, logoutAll } from "../controllers/usersController.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/", checkAuth, getCurrentUser);

router.post("/logout", logout);

router.post("/logout-all", logoutAll);

export default router;

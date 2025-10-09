import express from "express";
import checkAuth from "../middlewares/authMiddleware.js";
import { getCurrentUser, logout, login, register } from "../controllers/usersController.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/", checkAuth, getCurrentUser);

router.post("/logout", logout);

export default router;

import express from "express";
import checkAuth from "../middlewares/authMiddleware.js";
import { getUser, logoutUser, userLogin, userRegistration } from "../controllers/usersController.js";

const router = express.Router();

router.post("/register", userRegistration);

router.post("/login", userLogin);

router.get("/", checkAuth, getUser);

router.post("/logout", logoutUser);

export default router;

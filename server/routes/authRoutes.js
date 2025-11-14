import express from "express";
import {
  githubLogin,
  loginWithGoogle,
  sendOtp,
  verifyOtp,
} from "../controllers/authController.js";
import { rateLimiters } from "../utils/rateLimiting.js";

const router = express.Router();

router.post("/send-otp", rateLimiters.sendOtp, sendOtp);
router.post("/verify-otp", rateLimiters.verifyOtp, verifyOtp);
router.post("/google", rateLimiters.googleLogin, loginWithGoogle);
router.post("/github", rateLimiters.githubLogin, githubLogin);

export default router;

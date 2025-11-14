import express from "express";
import {
  githubLogin,
  loginWithGoogle,
  sendOtp,
  verifyOtp,
} from "../controllers/authController.js";
import { rateLimiters } from "../utils/rateLimiting.js";
import { throttlers } from "../utils/throttler.js";

const router = express.Router();

router.post("/send-otp", rateLimiters.sendOtp, throttlers.sendOtp, sendOtp);
router.post(
  "/verify-otp",
  rateLimiters.verifyOtp,
  throttlers.verifyOtp,
  verifyOtp
);
router.post(
  "/google",
  rateLimiters.googleLogin,
  throttlers.googleLogin,
  loginWithGoogle
);
router.post(
  "/github",
  rateLimiters.githubLogin,
  throttlers.githubLogin,
  githubLogin
);

export default router;

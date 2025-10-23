import express from "express";
import { githubLogin, loginWithGoogle, sendOtp, verifyOtp } from "../controllers/authController.js";

const router = express.Router();

router.post("/send-otp", sendOtp);

router.post("/verify-otp", verifyOtp);

router.post("/google", loginWithGoogle);

router.post("/github", githubLogin);

export default router;
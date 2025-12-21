import express from "express";
import { createSubscription, getSubscriptionDetails } from "../controllers/subscriptionController.js";
import checkAuth from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/", createSubscription);
router.get("/details", checkAuth, getSubscriptionDetails);
export default router;
import express from "express";
import { createSubscription, getSubscriptionDetails, getSubscriptionInvoice, cancelSubscription, pauseSubscription, resumeSubscription, renewalSubscription } from "../controllers/subscriptionController.js";
import checkAuth from "../middlewares/authMiddleware.js";
import { checkSubscriptionStatus } from "../controllers/subscriptionController.js";

const router = express.Router();

router.post("/", createSubscription);
router.post("/cancel", checkAuth, cancelSubscription);
router.post("/:id/pause", checkAuth, pauseSubscription);
router.post("/:id/resume", checkAuth, resumeSubscription);
router.get("/details", checkAuth, getSubscriptionDetails);

// invoice 

router.get("/invoice", checkAuth, getSubscriptionInvoice);

// check subscription status
router.get("/status/:id", checkAuth, checkSubscriptionStatus);

// Change Plan

router.get("/eligible-plans", checkAuth, renewalSubscription);
export default router;
import express from "express";
import { createSubscription, getSubscriptionDetails, getSubscriptionInvoice, cancelSubscription } from "../controllers/subscriptionController.js";
import checkAuth from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/", createSubscription);
router.post("/cancel", checkAuth, cancelSubscription);
router.get("/details", checkAuth, getSubscriptionDetails);

// invoice 

router.get("/invoice", checkAuth, getSubscriptionInvoice);

export default router;
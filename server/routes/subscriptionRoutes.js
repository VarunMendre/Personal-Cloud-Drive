import express from "express";
import { createSubscription, getSubscriptionDetails, getSubscriptionInvoice } from "../controllers/subscriptionController.js";
import checkAuth from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/", createSubscription);
router.get("/details", checkAuth, getSubscriptionDetails);

// invoice 

router.get("/invoice", checkAuth, getSubscriptionInvoice);

export default router;
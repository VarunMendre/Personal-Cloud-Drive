// TASK : Store all webhook events in a collection named 'webhooks'

import express from "express";
import { handleRazorpayWebhook } from "../controllers/webhookController.js";

const router = express.Router();

router.post("/razorpay", handleRazorpayWebhook);

export default router;
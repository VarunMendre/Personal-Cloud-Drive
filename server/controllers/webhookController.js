import crypto from "crypto";
import { WebhookEventHandler } from "../services/webhookevents/index.js";

export const handleRazorpayWebhook = async (req, res) => {
  const razorpaySignature = req.headers["x-razorpay-signature"];

  if (!razorpaySignature) {
    return res.status(400).json({ message: "Signature missing" });
  }

  const mySignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (razorpaySignature !== mySignature) {
    console.log("invalid signature");
    return res.status(400).json({ message: "Invalid signature" });
  }

  console.log("signature is valid");
  console.log("Event:", req.body.event);

  try {
    await WebhookEventHandler(req.body.event, req.body);
  } catch (error) {
    console.error("Error handling webhook event:", error);
    // Even if handling fails, we usually return 200 to Razorpay 
    // but log the error locally.
  }

  res.end("OK");
};

import crypto from "crypto";
import { WebhookEventHandler } from "../services/webhookevents/index.js";
import Webhook from "../models/rzpwebhookModel.js";

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

  // Create webhook record with pending status
  let webhookRecord;
  try {
    webhookRecord = await Webhook.create({
      eventType: req.body.event,
      signature: razorpaySignature,
      payload: req.body,
      userId: req.body.payload?.subscription?.entity?.notes?.userId || null,
      razorpaySubscriptionId: req.body.payload?.subscription?.entity?.id || null,
      status: "pending",
    });
  } catch (err) {
    console.error("Error creating webhook record:", err);
    // Continue processing even if logging fails
  }

  // Process the webhook event
  try {
    await WebhookEventHandler(req.body.event, req.body);
    
    // Update webhook record as processed
    if (webhookRecord) {
      await Webhook.findByIdAndUpdate(webhookRecord._id, {
        status: "processed",
        responseMessage: "Webhook processed successfully",
        processedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error handling webhook event:", error);
    
    // Mark webhook as failed
    if (webhookRecord) {
      await Webhook.findByIdAndUpdate(webhookRecord._id, {
        status: "failed",
        responseMessage: error.message || "Webhook processing failed",
        processedAt: new Date(),
      });
    }
    
    // Even if handling fails, we usually return 200 to Razorpay 
    // but log the error locally.
  }

 
  res.end("OK");
};

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
    return res.status(400).json({ message: "Invalid signature" });
  }

  // Extract entity dynamically
  const entityType = Object.keys(req.body.payload)[0];
  const entity = req.body.payload[entityType]?.entity || {};

  // Log webhook as pending
  let webhookRecord;
  try {
    webhookRecord = await Webhook.create({
      eventType: req.body.event,
      signature: razorpaySignature,
      payload: req.body,
      userId: entity.notes?.userId || null,
      razorpaySubscriptionId: entity.id || entity.subscription_id || null,
      status: "pending",
    });
  } catch (err) {
    console.error("Webhook logging failed:", err.message);
  }

  try {
    // Process the event
    await WebhookEventHandler(req.body.event, req.body);

    // Update log -> Success
    if (webhookRecord) {
      await Webhook.findByIdAndUpdate(webhookRecord._id, {
        status: "processed",
        responseMessage: "Success",
        processedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Webhook processing error:", error.message);

    // Update log -> Failed
    if (webhookRecord) {
      await Webhook.findByIdAndUpdate(webhookRecord._id, {
        status: "failed",
        responseMessage: error.message || "Processing failed",
        processedAt: new Date(),
      });
    }
  }

  res.status(200).end("OK");
};

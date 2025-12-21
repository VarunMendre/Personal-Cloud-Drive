import Razorpay from "razorpay";
import crypto from "crypto";
import Subscription from "../models/subscriptionModel.js";
import User from "../models/userModel.js";
/**
 * Monthly
 * Yearly
 *
 *Monthly
 * Yearly
 *
 * Monthly
 * Yearly
 */

export const PLANS = {
  plan_Ru3jDykYh0gNRc: {
    storageQuotaInBytes: 2 * 1024 ** 3,
  },
  plan_Ru3i26Gd3gyVqu: {
    storageQuotaInBytes: 2 * 1024 ** 3,
  },
  plan_Ru3gKytERw7sDx: {
    storageQuotaInBytes: 5 * 1024 ** 3,
  },
  plan_Ru3fRpu6PZE4ex: {
    storageQuotaInBytes: 5 * 1024 ** 3,
  },
  plan_Ru3dfYH472oEwi: {
    storageQuotaInBytes: 10 * 1024 ** 4,
  },
  plan_Ru3bLudarN1V9a: {
    storageQuotaInBytes: 10 * 1024 ** 4,
  },
};

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

  console.log(req.body);
  if (req.body.event === "subscription.activated") {
    const rzpSubscription = req.body.payload.subscription.entity;
    const planId = rzpSubscription.plan_id;

    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: rzpSubscription.id,
    });

    subscription.status = rzpSubscription.status;
    await subscription.save();

    const storageQuotaInBytes = PLANS[planId].storageQuotaInBytes;
    const user = await User.findById(subscription.userId);

    user.maxStorageLimit = storageQuotaInBytes;
    await user.save();
  }
  res.end("OK");
};

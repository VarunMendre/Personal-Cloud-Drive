import Razorpay from "razorpay";
import crypto from "crypto";
import Subscription from "../models/subscriptionModel.js";
import User from "../models/userModel.js";
import { resetUserToDefault } from "../utils/resetUserLimits.js";

// /**
//  * Monthly
//  * Yearly
//  *
//  *Monthly
//  * Yearly
//  *
//  * Monthly
//  * Yearly
//  *

import { SUBSCRIPTION_PLANS as PLANS } from "../config/subscriptionPlans.js";

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

    if (subscription) {
      subscription.status = rzpSubscription.status;
      subscription.currentPeriodStart = new Date(
        rzpSubscription.current_start * 1000
      );
      subscription.currentPeriodEnd = new Date(
        rzpSubscription.current_end * 1000
      );
      subscription.startDate = rzpSubscription.start_at
        ? new Date(rzpSubscription.start_at * 1000)
        : null;
      subscription.endDate = rzpSubscription.end_at
        ? new Date(rzpSubscription.end_at * 1000)
        : null;

      await subscription.save();

      const planInfo = PLANS[planId];
      if (planInfo) {
        const user = await User.findById(subscription.userId);
        if (user) {
          user.maxStorageLimit = planInfo.storageQuotaInBytes;
          user.maxDevices = planInfo.maxDevices;
          user.maxFileSize = planInfo.maxFileSize;
          user.subscriptionId = rzpSubscription.id;
          await user.save();
          console.log(`Updated user ${user._id} limits: Storage=${planInfo.storageQuotaInBytes}, Devices=${planInfo.maxDevices}, FileSize=${planInfo.maxFileSize}`);
        }
      }
    }
  } else if (req.body.event === "subscription.cancelled") {
    const rzpSubscription = req.body.payload.subscription.entity;

    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: rzpSubscription.id,
    });

    if (subscription) {
      subscription.status = "cancelled";
      subscription.cancelledAt = new Date().toISOString();
      await subscription.save();

      // Reset user to default and delete subscription files
      await resetUserToDefault(subscription.userId);
      console.log(`Subscription cancelled for user ${subscription.userId} via webhook.`);
    }
  }
  res.end("OK");
};

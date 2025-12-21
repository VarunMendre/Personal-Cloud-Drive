import Razorpay from "razorpay";
import crypto from "crypto";
import Subscription from "../models/subscriptionModel.js";
import User from "../models/userModel.js";
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

export const PLANS = {
  // Standard Monthly - 100 GB
  plan_RuC1EiZlwurf5N: {
    storageQuotaInBytes: 100 * 1024 ** 3,
  },
  // Premium Monthly - 200 GB
  plan_RuC2evjqwSxHOH: {
    storageQuotaInBytes: 200 * 1024 ** 3,
  },
  // Standard Yearly - 200 GB
  plan_RuC3yiXd7cecny: {
    storageQuotaInBytes: 200 * 1024 ** 3,
  },
  // Premium Yearly - 300 GB
  plan_RuC5FeIwTTfUSh: {
    storageQuotaInBytes: 300 * 1024 ** 3,
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
          await user.save();
        }
      }
    }
  }
  res.end("OK");
};

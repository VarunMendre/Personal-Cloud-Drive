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

    subscription.status = rzpSubscription.status;
    await subscription.save();

    const storageQuotaInBytes = PLANS[planId].storageQuotaInBytes;
    const user = await User.findById(subscription.userId);

    user.maxStorageLimit = storageQuotaInBytes;
    await user.save();
  }
  res.end("OK");
};

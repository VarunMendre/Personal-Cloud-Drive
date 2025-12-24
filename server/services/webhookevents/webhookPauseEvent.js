import Subscription from "../../models/subscriptionModel.js";
import { resetUserToDefault } from "../../utils/resetUserLimits.js";

export const handlePauseEvent = async (webhookBody) => {
  const rzpSubscription = webhookBody.payload.subscription.entity;

  const subscription = await Subscription.findOne({
    razorpaySubscriptionId: rzpSubscription.id,
  });

  if (subscription) {
    subscription.status = "paused";
    await subscription.save();

    // Revoke pro features during pause
    await resetUserToDefault(subscription.userId);

    console.log(`Subscription ${subscription.razorpaySubscriptionId} paused and limits reset via webhook.`);
  }
};

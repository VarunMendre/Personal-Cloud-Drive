import Subscription from "../../models/subscriptionModel.js";
import { resetUserToDefault } from "../../utils/resetUserLimits.js";

export const handleCancelledEvent = async (webhookBody) => {
  const rzpSubscription = webhookBody.payload.subscription.entity;

  const subscription = await Subscription.findOne({
    razorpaySubscriptionId: rzpSubscription.id,
  });

  if (subscription) {
    subscription.status = "cancelled";
    subscription.cancelledAt = new Date().toISOString();
    await subscription.save();

    // Reset user to default and delete subscription files
    await resetUserToDefault(subscription.userId);
    console.log(
      `Subscription cancelled for user ${subscription.userId} via webhook.`
    );
  }
};

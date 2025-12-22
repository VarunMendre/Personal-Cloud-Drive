import Subscription from "../../models/subscriptionModel.js";

export const handlePauseEvent = async (webhookBody) => {
  const rzpSubscription = webhookBody.payload.subscription.entity;

  const subscription = await Subscription.findOne({
    razorpaySubscriptionId: rzpSubscription.id,
  });

  if (subscription) {
    subscription.status = "paused";
    await subscription.save();
    console.log(`Subscription ${subscription.razorpaySubscriptionId} paused via webhook.`);
  }
};

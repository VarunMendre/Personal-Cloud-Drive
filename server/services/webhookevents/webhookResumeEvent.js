import Subscription from "../../models/subscriptionModel.js";

export const handleResumeEvent = async (webhookBody) => {
  const rzpSubscription = webhookBody.payload.subscription.entity;

  const subscription = await Subscription.findOne({
    razorpaySubscriptionId: rzpSubscription.id,
  });

  if (subscription) {
    subscription.status = "active";
    await subscription.save();
    console.log(`Subscription ${subscription.razorpaySubscriptionId} resumed via webhook.`);
  }
};

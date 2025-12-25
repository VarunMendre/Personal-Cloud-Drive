import User from "../../models/userModel.js";
import Subscription from "../../models/subscriptionModel.js";
import { resetUserToDefault } from "../../utils/resetUserLimits.js";
import { sendSubscriptionPausedEmail } from "../emailService/subscriptionPaused.js";

export const handlePauseEvent = async (webhookBody) => {
  const rzpSubscription = webhookBody.payload.subscription.entity;

  const subscription = await Subscription.findOne({
    razorpaySubscriptionId: rzpSubscription.id,
  });

  if (subscription) {
    subscription.status = "paused";
    await subscription.save();

    // Send Pause Email
    try {
      const user = await User.findById(subscription.userId);
      if (user) {
        await sendSubscriptionPausedEmail(user.email, user.name);
      }
    } catch (emailErr) {
      console.error("Failed to send pause email:", emailErr.message);
    }

    console.log(`Subscription ${subscription.razorpaySubscriptionId} paused and limits reset via webhook.`);
  }
};

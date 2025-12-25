import Subscription from "../../models/subscriptionModel.js";
import User from "../../models/userModel.js";
import { SUBSCRIPTION_PLANS as PLANS } from "../../config/subscriptionPlans.js";
import { sendSubscriptionResumedEmail } from "../emailService/subscriptionResumed.js";

export const handleResumeEvent = async (webhookBody) => {
  const rzpSubscription = webhookBody.payload.subscription.entity;

  const subscription = await Subscription.findOne({
    razorpaySubscriptionId: rzpSubscription.id,
  });

  if (subscription) {
    subscription.status = "active";
    await subscription.save();

    // Restore pro features
    const planInfo = PLANS[subscription.planId];
    if (planInfo) {
      const user = await User.findById(subscription.userId);
      if (user) {
        user.maxStorageLimit = planInfo.storageQuotaInBytes;
        user.maxDevices = planInfo.maxDevices;
        user.maxFileSize = planInfo.maxFileSize;
        user.subscriptionId = rzpSubscription.id;
        await user.save();

        // Send Resume Email
        try {
          await sendSubscriptionResumedEmail(user.email, user.name);
        } catch (emailErr) {
          console.error("Failed to send resume email:", emailErr.message);
        }

        console.log(`Subscription ${subscription.razorpaySubscriptionId} resumed and limits restored.`);
      }
    }
  }
};

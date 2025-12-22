import Subscription from "../../models/subscriptionModel.js";
import User from "../../models/userModel.js";
import { SUBSCRIPTION_PLANS as PLANS } from "../../config/subscriptionPlans.js";

export const handleActivationEvent = async (webhookBody) => {
  const rzpSubscription = webhookBody.payload.subscription.entity;
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
        console.log(
          `Updated user ${user._id} limits: Storage=${planInfo.storageQuotaInBytes}, Devices=${planInfo.maxDevices}, FileSize=${planInfo.maxFileSize}`
        );
      }
    }
  }
};

import Subscription from "../../models/subscriptionModel.js";
import { resetUserToDefault } from "../../utils/resetUserLimits.js";

export const webhookHaltedEvent = async (payload) => {
  const { id: razorpaySubscriptionId } = payload.subscription.entity;

  try {
    const subscription = await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId },
      {
        status: "halted",
        gracePeriodEndsAt: null,
      },
      { new: true }
    );

    if (subscription) {
      // If subscription is halted (payment failed after grace period), revert to free tier
      await resetUserToDefault(subscription.userId);
      console.log(`🛑 User limits reset for halted subscription: ${razorpaySubscriptionId}`);
    }
  } catch (error) {
    console.error("Error while halting", error);
  }

  console.log(`🛑 Subscription ${razorpaySubscriptionId} marked as HALTED.`);
};

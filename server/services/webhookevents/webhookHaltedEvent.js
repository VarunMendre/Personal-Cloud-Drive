import Subscription from "../../models/subscriptionModel.js";

export const webhookHaltedEvent = async (payload) => {
  const { id: razorpaySubscriptionId } = payload.subscription.entity;

  try {
    await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId },
      {
        status: "halted",
        gracePeriodEndsAt: null,
      }
    );
  } catch (error) {
    console.error("Error while halting",error);
  }

  console.log(`🛑 Subscription ${razorpaySubscriptionId} marked as HALTED.`);
};

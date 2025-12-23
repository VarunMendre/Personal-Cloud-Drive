import Subscription from "../../models/subscriptionModel.js";

export const webhookPaymentFailedEvent = async (payload) => {
  const { id: razorpaySubscriptionId } = payload.subscription.entity;

  // Calculate 3 day grace period
  const gracePeriod = new Date();
  gracePeriod.setDate(gracePeriod.getDate() + 3);

  try {
    await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId },
      {
        status: "pending",
        lastPaymentAttempt: new Date(),
        gracePeriodEndsAt: gracePeriod,
        $inc: { retryCount: 1 },
      }
    );
  } catch (error) {
    console.error("Error while putting into grace Period",error);
  }

  console.log(
    `⚠️ Subscription ${razorpaySubscriptionId} marked as PENDING. Grace period until ${gracePeriod}`
  );
};

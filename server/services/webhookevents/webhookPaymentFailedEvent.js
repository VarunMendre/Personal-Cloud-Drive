import User from "../../models/userModel.js";
import Subscription from "../../models/subscriptionModel.js";
import { sendSubscriptionGracePeriodEmail } from "../emailService/subscriptionGracePeriod.js";

export const webhookPaymentFailedEvent = async (webhookBody) => {
  const { id: razorpaySubscriptionId } = webhookBody.payload.subscription.entity;

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

    // Send Grace Period Email
    try {
      const subscription = await Subscription.findOne({ razorpaySubscriptionId });
      if (subscription) {
        const user = await User.findById(subscription.userId);
        if (user) {
          await sendSubscriptionGracePeriodEmail(user.email, user.name, 3);
        }
      }
    } catch (emailErr) {
      console.error("Failed to send grace period email:", emailErr.message);
    }
  } catch (error) {
    console.error("Error while putting into grace Period", error);
  }

  console.log(
    `⚠️ Subscription ${razorpaySubscriptionId} marked as PENDING. Grace period until ${gracePeriod}`
  );
};

import Subscription from "../../models/subscriptionModel.js";
import { rzpInstance } from "./createSubscription.js";
import { handleRazorpayError } from "../../utils/razorpayErrorHandler.js";

export const resumeSubscriptionService = async (subscriptionId) => {
  try {
    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: subscriptionId,
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Call Razorpay to resume
    const rzpResponse = await rzpInstance.subscriptions.resume(subscriptionId, {
      resume_at: "now",
    });

    // Update status locally for immediate feedback
    subscription.status = "active";
    await subscription.save();

    return { success: true, message: "Subscription resumed successfully", rzpResponse };
  } catch (error) {
    console.error("Error in resumeSubscriptionService:", error);
    throw handleRazorpayError(error, "Failed to resume subscription");
  }
};

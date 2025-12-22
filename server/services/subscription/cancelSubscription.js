import Subscription from "../../models/subscriptionModel.js";
import User from "../../models/userModel.js";
import File from "../../models/fileModel.js";
import Directory from "../../models/directoryModel.js";
import { rzpInstance } from "./createSubscription.js";
import { resetUserToDefault } from "../../utils/resetUserLimits.js";

export const cancelSubscriptionService = async (userId, planId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // 1. Check if user storage is below 500MB (524288000 bytes)
    const rootDir = await Directory.findById(user.rootDirId);
    if (!rootDir) {
      throw new Error("Root directory not found");
    }

    const currentStorageUsed = rootDir.size;
    const limit500MB = 524288000;

    if (currentStorageUsed > limit500MB) {
      return {
        success: false,
        message: "Your storage limit should be below 500MB to cancel the subscription. Please delete some files.",
      };
    }

    const subscription = await Subscription.findOne({
      userId,
      status: "active",
    });

    if (!subscription) {
      return { success: false, message: "No active subscription found" };
    }

    const subscriptionId = subscription.razorpaySubscriptionId;

    // Cancel in Razorpay
    const rzpResponse = await rzpInstance.subscriptions.cancel(subscriptionId, {
      cancel_at_cycle_end: false,
    });
    console.log("DEBUG: Razorpay Cancellation Response:", rzpResponse);

    // Update subscription in DB
    subscription.status = "cancelled";
    subscription.cancelledAt = new Date().toISOString();
    await subscription.save();

    // 2. Delete files which have haveSubscription = true and Update user model back to default
    await resetUserToDefault(userId);

    return { success: true, message: "Subscription cancelled successfully", subscription };
  } catch (error) {

    console.error("Error in cancelSubscriptionService:", error);
    throw error;
  }
};

import Subscription from "../../models/subscriptionModel.js";
import { rzpInstance } from "./createSubscription.js";
import { handleRazorpayError } from "../../utils/razorpayErrorHandler.js";

export const pauseSubscriptionService = async (subscriptionId) => {
    try {
        const subscription = await Subscription.findOne({
            razorpaySubscriptionId: subscriptionId,
        });

        if (!subscription) {
            throw new Error("Subscription not found");
        }

        // Call Razorpay to pause
        // pause_at: 'now' (immediate) or 'cycle_end'
        const rzpResponse = await rzpInstance.subscriptions.pause(subscriptionId, {
            pause_at: "now",
        });

        // We don't update status here - the webhook handlePauseEvent will do it 
        // to ensure sync between Razorpay and our DB.
        // However, for immediate UI responsiveness, we can update it locally too.
        subscription.status = "paused";
        await subscription.save();

        return { success: true, message: "Subscription paused successfully", rzpResponse };
    } catch (error) {
        console.error("Error in pauseSubscriptionService:", error);
        throw handleRazorpayError(error, "Failed to pause subscription");
    }
};

import Razorpay from "razorpay";
import Subscription from "../../models/subscriptionModel.js";

export const rzpInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createSubscriptionService = async (userId, planId) => {
    // Check for any subscription that isn't halted/cancelled
    const existingSubscription = await Subscription.findOne({
        userId,
        status: { $in: ["active", "created", "pending", "past_due"] },
    });

    if (existingSubscription) {
        // If it's already active, show the specific error
        if (existingSubscription.status === "active") {
            const error = new Error("You already have an active subscription");
            error.status = 400;
            throw error;
        }
        // If it's just 'created', return that ID so they can finish payment
        return { subscriptionId: existingSubscription.razorpaySubscriptionId };
    }

    const isYearly = ["plan_RuC3yiXd7cecny", "plan_RuC5FeIwTTfUSh"].includes(planId);

    try {
        const newSubscription = await rzpInstance.subscriptions.create({
            plan_id: planId,
            total_count: isYearly ? 10 : 60,
            notes: {
                userId: userId.toString(),
            },
        });

        const subscription = new Subscription({
            razorpaySubscriptionId: newSubscription.id,
            planId,
            userId,
        });

        await subscription.save();

        return { subscriptionId: newSubscription.id };
    } catch (error) {
        console.log("Error in createSubscriptionService:", error);
        throw error;
    }
};

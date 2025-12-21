import Razorpay from "razorpay";
import Subscription from "../../models/subscriptionModel.js";

export const rzpInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createSubscriptionService = async (userId, planId) => {
    // Check if user already has an active subscription
    const activeSubscription = await Subscription.findOne({
        userId,
        status: "active",
    });

    if (activeSubscription) {
        return { message: "You already have an active subscription" };
    }

    // Check if user has a pending subscription for the SAME plan
    const pendingSubscription = await Subscription.findOne({
        userId,
        planId,
        status: "created",
    });

    if (pendingSubscription) {
        return { subscriptionId: pendingSubscription.razorpaySubscriptionId };
    }

    const isYearly = ["plan_RuC3yiXd7cecny", "plan_RuC5FeIwTTfUSh"].includes(planId);

    try {
        const newSubscription = await rzpInstance.subscriptions.create({
            plan_id: planId,
            total_count: isYearly ? 10 : 60,
            notes: {
                user: userId.toString(),
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

import Subscription from "../../models/subscriptionModel.js";
import { rzpInstance } from "./createSubscription.js";
import { PLAN_INFO } from "./getSubscriptionDetails.js";

export const changePlanService = async (userId, planId) => {
  try {
    // 1. Find the current subscription exits and is active
    const currSubscription = await Subscription.findOne({
      userId,
      status: "active",
    });

    if (!currSubscription) {
      const error = new Error("No active subscription found to upgrade from");
      error.status = 400;
      throw error;
    }

    // 2. Check if subscription has expired

    const now = new Date();
    const periodEnd = new Date(currSubscription.currentPeriodEnd);

    if (now > periodEnd) {
      const error = new Error(
        "Your current subscription has expired. Please purchase a new plan"
      );
      error.status = 400;
      throw error;
    }

    // 3. Calculate bonus days

    const currentPrice = PLAN_INFO[currSubscription.planId]?.price || 0;
    const daysRemaining = Math.max(
      0,
      Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24))
    );

    const creditAmount = Math.floor((currentPrice / 30) * daysRemaining);
    const targetPlanPrice = PLAN_INFO[planId]?.price || 0;
    const bonusDays = Math.min(
      Math.floor((creditAmount / targetPlanPrice) * 30),
      15
    );

    // 4. Validating minimum bonus days

    if (bonusDays < 1) {
      const error = new Error(
        "Please wait 1 day before upgrading to accumulate minimum bonus days"
      );
      error.status = 400;
      throw error;
    }

    const isYearly = ["plan_RuC3yiXd7cecny", "plan_RuC5FeIwTTfUSh"].includes(
      planId
    );

    // 5. Create New Subscription

    const newSubscription = await rzpInstance.subscriptions.create({
      plan_id: planId,
      total_count: isYearly ? 10 : 60,
      quantity: 1,
      notes: {
        userId: userId.toString(),
        migrationFrom: currSubscription.razorpaySubscriptionId,
        bonusDays: bonusDays.toString(),
      },
    });

    // 6. save Subscription with bonus days
    const subscription = new Subscription({
      razorpaySubscriptionId: newSubscription.id,
      planId,
      userId,
      status: "created",
      bonusDays: bonusDays,
    });
    await subscription.save();

    console.log(
      `Upgrade initiated: User ${userId} → Plan ${planId}, Bonus: ${bonusDays} days`
    );

    return { subscriptionId: newSubscription.id };
  } catch (error) {
    console.error("Error in changePlanService:", error);
    throw error;
  }
};

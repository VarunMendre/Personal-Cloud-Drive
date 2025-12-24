import { features } from "node:process";
import Subscription from "../../models/subscriptionModel.js";
import { PLAN_INFO } from "./getSubscriptionDetails.js";

export const getEligiblePlanService = async (userId) => {
  // 1. find the user's active subscription

  const activeSub = await Subscription.findOne({ userId, status: "active" });

  // 2. current plan price
  const currentPlanId = activeSub?.planId;
  const currentPrice = PLAN_INFO[currentPlanId]?.price || 0;

  // 3. decide days left in current plan

  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(activeSub.currentPeriodEnd) - new Date()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const credit = Math.floor((currentPrice / 30) * daysRemaining);

  const allPlans = Object.keys(PLAN_INFO)
    .filter((planId) => {
      // Exclude current plan AND only show plans with higher price
      return planId !== currentPlanId && PLAN_INFO[planId].price > currentPrice;
    })
    .map((planId) => {
      const targetPrice = PLAN_INFO[planId].price;
      const bonusDays = Math.floor((credit / targetPrice) * 30);
      const cappedBonusDays = Math.min(bonusDays, 15);

      return {
        id: planId,
        ...PLAN_INFO[planId],
        features: getPlanFeatures(planId),
        creditAmount: credit,
        bonusDays: bonusDays,
        cappedBonusDays: cappedBonusDays,
      };
    });

  // Filter out plans with < 1 bonus day
  const eligiblePlans = allPlans.filter(plan => plan.cappedBonusDays >= 1);

  // Check if user is on highest plan (₹7999)
  if (currentPrice >= 7999) {
    return {
      eligiblePlans: [],
      daysRemaining,
      message: "You're using the highest tier plan. To downgrade, please wait until your current plan expires."
    };
  }

  // If no eligible plans due to insufficient bonus days
  if (eligiblePlans.length === 0 && allPlans.length > 0) {
    return {
      eligiblePlans: [],
      daysRemaining,
      message: "Please wait 1 day before upgrading to accumulate minimum bonus days"
    };
  }

  // If no plans available at all (shouldn't happen unless on highest plan)
  if (eligiblePlans.length === 0) {
    return {
      eligiblePlans: [],
      daysRemaining,
      message: "No upgrade options available at this time"
    };
  }

  return { eligiblePlans, daysRemaining };
};

// Simple helper to match FE features
function getPlanFeatures(id) {
  const features = {
    plan_RuC1EiZlwurf5N: ["100 GB storage", "1 GB upload limit", "2 devices"],
    plan_RuC2evjqwSxHOH: ["200 GB storage", "2 GB upload limit", "3 devices"],
    plan_RuC3yiXd7cecny: [
      "200 GB yearly storage",
      "1 GB upload limit",
      "2 devices",
      "Yearly Savings",
    ],
    plan_RuC5FeIwTTfUSh: [
      "300 GB yearly storage",
      "2 GB upload limit",
      "3 devices",
      "Priority Support",
    ],
  };
  return features[id] || [];
}

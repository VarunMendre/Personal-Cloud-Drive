import Subscription from "../../models/subscriptionModel.js";
import { PLAN_INFO } from "./getSubscriptionDetails.js";

export const getEligiblePlanService = async (userId) => {
  // 1. find the user's active subscription

  const activeSub = await Subscription.findOne({ userId, status: "active" });

  // 2. current plan price
  const currentPlanId = activeSub?.planId;
  const currentPrice = PLAN_INFO[currentPlanId]?.price || 0;

  // 3. Filter plan_info with higher prices

  const eligiblePlans = Object.keys(PLAN_INFO)
    .filter((planId) => {
      // condition 1: must be different plan
      // condition 2: must be expensive then current one

      return planId !== currentPlanId && PLAN_INFO[planId].price > currentPrice;
    })
    .map((planId) => {
      return {
        id: planId,
        ...PLAN_INFO[planId],
        features: getPlanFeatures(planId),
      };
    });

  return eligiblePlans;
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

import Subscription from "../models/subscriptionModel.js";
export const processAuthenticatedTrials = async () => {
  try {
    const now = new Date();
    // Find all subscriptions in authenticated state with expired trial
    const expiredTrials = await Subscription.find({
      status: "authenticated",
      authenticatedPeriodEnd: { $lte: now },
    });
    for (const sub of expiredTrials) {
      // Start second billing cycle
      const newPeriodStart = now;
      const newPeriodEnd = new Date(now);
      newPeriodEnd.setDate(newPeriodEnd.getDate() + 30);
      await Subscription.findByIdAndUpdate(sub._id, {
        status: "active",
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd,
        bonusDays: 0, // Consumed
        authenticatedPeriodStart: null,
        authenticatedPeriodEnd: null,
      });
      console.log(
        `Trial expired, started second cycle: ${sub.razorpaySubscriptionId}`
      );
    }
    return { processed: expiredTrials.length };
  } catch (error) {
    console.error("Error processing authenticated trials:", error);
    return { processed: 0, error: error.message };
  }
};

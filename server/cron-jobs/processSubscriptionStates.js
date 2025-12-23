import cron from "node-cron";
import Subscription from "../models/subscriptionModel.js";

export const processSubscriptionStates = () => {
  // Running this everyday at midnight: "0 0 * * *"

  cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        console.log("🔄Running daily subscription state check...");

        // 1. Pending -> Halted (after grace period)
        const haltedResult = await Subscription.updateMany(
          {
            status: "pending",
            gracePeriodEndsAt: { $lt: new Date() },
          },
          {
            $set: { status: "halted", gracePeriodEndsAt: null },
          }
        );

        // 2. Cancelled -> Expired (after period ends)
        const expiredResult = await Subscription.updateMany(
          {
            status: "cancelled",
            currentPeriodEnd: { $lt: new Date() },
          },
          {
            $set: { status: "expired" },
          }
        );

        console.log(
          `✅ Daily Sync: ${haltedResult.modifiedCount} Halted, ${expiredResult.modifiedCount} Expired.`
        );
      } catch (error) {
        console.error("Cron job error:", error);
      }
    },
    {
      schedule: true,
      timezone: "Asia/Kolkata",
    }
  );
};

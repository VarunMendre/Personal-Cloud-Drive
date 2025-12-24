import cron from "node-cron";
import { processSubscriptionStates } from "./processSubscriptionStates.js";
import { processAuthenticatedTrials } from "./authenticatedTrialProcessor.js";
import { cleanupOrphanedUploads } from "./cleanupUploads.js";

export const startCronJobs = () => {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Initializing Cron Jobs
🕒 Timezone : Asia/Kolkata
📅 Jobs     : Subscription state processor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  // removePendingSubscriptionsFromDatabase();
  processSubscriptionStates();

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Cron Jobs registered successfully
⏱️ Schedulers are active and waiting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  cron.schedule("0 * * * *", async () => {
    console.log("Running authenticated trial processor...");
    await processAuthenticatedTrials();
  });

  cleanupOrphanedUploads();
};

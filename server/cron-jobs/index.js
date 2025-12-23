import { processSubscriptionStates } from "./processSubscriptionStates.js";

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
};

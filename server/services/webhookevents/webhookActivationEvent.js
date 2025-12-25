import Subscription from "../../models/subscriptionModel.js";
import User from "../../models/userModel.js";
import { SUBSCRIPTION_PLANS as PLANS } from "../../config/subscriptionPlans.js";
import { rzpInstance } from "../subscription/createSubscription.js";
import { sendSubscriptionActiveEmail } from "../emailService/subscriptionActive.js";

export const handleActivationEvent = async (webhookBody) => {
  const rzpSubscription = webhookBody.payload.subscription.entity;
  const planId = rzpSubscription.plan_id;
  const subId = rzpSubscription.id;

  console.log(`[Activation] Received for Sub: ${subId}, Status: ${rzpSubscription.status}`);

  const subscription = await Subscription.findOne({
    razorpaySubscriptionId: rzpSubscription.id,
  });

  if (subscription) {
    subscription.status = rzpSubscription.status;
    subscription.currentPeriodStart = new Date(
      rzpSubscription.current_start * 1000
    );
    subscription.currentPeriodEnd = new Date(
      rzpSubscription.current_end * 1000
    );
    subscription.startDate = rzpSubscription.start_at
      ? new Date(rzpSubscription.start_at * 1000)
      : null;
    subscription.endDate = rzpSubscription.end_at
      ? new Date(rzpSubscription.end_at * 1000)
      : null;

    await subscription.save();

    const planInfo = PLANS[planId];
    if (planInfo) {
      const user = await User.findById(subscription.userId);
      if (user) {
        user.maxStorageLimit = planInfo.storageQuotaInBytes;
        user.maxDevices = planInfo.maxDevices;
        user.maxFileSize = planInfo.maxFileSize;
        user.subscriptionId = rzpSubscription.id;
        await user.save();
        console.log(
          `Updated user ${user._id} limits: Storage=${planInfo.storageQuotaInBytes}, Devices=${planInfo.maxDevices}, FileSize=${planInfo.maxFileSize}`
        );

        // Fetch recent invoice link for the activation email
        let finalInvoiceUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/subscription`;
        try {
          const invoices = await rzpInstance.invoices.all({
            subscription_id: subId,
          });
          const lastPaidInvoice = invoices.items?.find((inv) => inv.status === "paid");
          if (lastPaidInvoice && lastPaidInvoice.short_url) {
            finalInvoiceUrl = lastPaidInvoice.short_url;
          }
        } catch (invErr) {
          console.error("[Activation] Could not fetch invoice for email:", invErr.message);
        }

        // Send Activation Email
        try {
          const storageLimitGb = Math.round(planInfo.storageQuotaInBytes / (1024 * 1024 * 1024));

          await sendSubscriptionActiveEmail(
            user.email,
            user.name,
            planInfo.name,
            storageLimitGb,
            finalInvoiceUrl,
            "View My Invoice"
          );
        } catch (emailErr) {
          console.error("Failed to send activation email:", emailErr.message);
        }
      }
    }

    // Fail-safe cleanup for migrations
    const migrationFrom = rzpSubscription.notes?.migrationFrom;
    if (migrationFrom) {
      try {
        const deleted = await Subscription.deleteOne({ razorpaySubscriptionId: migrationFrom });
        if (deleted.deletedCount > 0) {
          console.log(`[Activation] Deleted old subscription record: ${migrationFrom}`);
        }
      } catch (err) {
        console.error(`[Activation] Failed to cleanup old sub ${migrationFrom}:`, err.message);
      }
    }
  }
};

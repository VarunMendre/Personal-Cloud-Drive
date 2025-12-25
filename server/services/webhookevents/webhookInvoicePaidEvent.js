import Subscription from "../../models/subscriptionModel.js";
import User from "../../models/userModel.js";
import { SUBSCRIPTION_PLANS } from "../../config/subscriptionPlans.js";
import { rzpInstance } from "../subscription/createSubscription.js";
import { sendSubscriptionActiveEmail } from "../emailService/subscriptionActive.js";

export const handleInvoicePaidEvent = async (webhookBody) => {
  try {
    const event = webhookBody.event;
    let newSubId;
    let invoiceData = null;

    if (event === "invoice.paid") {
      invoiceData = webhookBody.payload.invoice.entity;
      newSubId = invoiceData.subscription_id;
    } else if (event === "subscription.charged") {
      newSubId = webhookBody.payload.subscription.entity.id;
      // For subscription.charged, we might not have a hosted_url immediately
    }

    if (!newSubId) {
      console.error(`Could not extract subscription ID from event: ${event}`);
      return { success: false };
    }

    // 1. Fetch subscription details from Razorpay
    const rzpSub = await rzpInstance.subscriptions.fetch(newSubId);
    const userId = rzpSub.notes?.userId;
    const oldSubId = rzpSub.notes?.migrationFrom;
    const bonusDays = parseInt(rzpSub.notes?.bonusDays) || 0;

    if (!userId) {
      console.error("No userId found in subscription notes");
      return { success: false };
    }

    // 2. Check if this payment first payment or recurring payment

    const existingSub = await Subscription.findOne({
      razorpaySubscriptionId: newSubId,
    });

    const isFirstPayment = !existingSub || existingSub.status === "created" || !existingSub.invoiceId;

    console.log(`[InvoicePaid] Sub: ${newSubId}, isFirstPayment: ${isFirstPayment}, Has Migration: ${!!oldSubId}`);

    // 3. Handle first payment (upgrade payment)
    if (isFirstPayment) {
      const planInfo = SUBSCRIPTION_PLANS[rzpSub.plan_id];
      if (!planInfo) {
        console.error(`Plan not found: ${rzpSub.plan_id}`);
        return { success: false };
      }

      const user = await User.findById(userId);
      if (!user) {
        console.error(`User not found: ${userId}`);
        return { success: false };
      }

      user.maxStorageLimit = planInfo.storageQuotaInBytes;
      user.maxDevices = planInfo.maxDevices;
      user.maxFileSize = planInfo.maxFileSize;
      user.subscriptionId = newSubId;
      await user.save();

      // Activate subscription (first 30-day cycle)

      await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: newSubId },
        {
          planId: rzpSub.plan_id,
          status: "active",
          currentPeriodStart: new Date(rzpSub.current_start * 1000),
          currentPeriodEnd: new Date(rzpSub.current_end * 1000),
          bonusDays: bonusDays,
          startDate: new Date(rzpSub.start_at * 1000),
          invoiceId: invoiceData?.id || null,
        },
        { upsert: true }
      );

      // Send Activation Email (Double check if we should skip or send again with better URL)
      try {
        const storageLimitGb = Math.round(planInfo.storageQuotaInBytes / (1024 * 1024 * 1024));
        await sendSubscriptionActiveEmail(
          user.email,
          user.name,
          planInfo.name,
          storageLimitGb,
          invoiceData?.hosted_url || invoiceData?.short_url || `${process.env.CLIENT_URL}/subscription`,
          "View My Invoice"
        );
      } catch (emailErr) {
        console.error("Failed to send activation email:", emailErr.message);
      }

      // Cancel old Subscription

      if (oldSubId) {
        try {
          await rzpInstance.subscriptions.cancel(oldSubId, {
            cancel_at_cycle_end: 0,
          });

          // Delete the old subscription record to keep DB clean as per user request
          await Subscription.deleteOne({ razorpaySubscriptionId: oldSubId });

          console.log(`Deleted old subscription record: ${oldSubId}`);
        } catch (error) {
          console.error(`Failed to cleanup old sub: ${error.message}`);
        }
      }

      console.log(
        `First payment processed: ${newSubId}, Bonus: ${bonusDays} days`
      );
    }

    // 4. Handel second payment (after first 30-day cycle
    else if (existingSub.status === "active" && bonusDays > 0) {
      // Payment succeeded, start authenticated trial

      const trialStart = new Date();
      const trialEnd = new Date(trialStart);
      trialEnd.setDate(trialEnd.getDate() + bonusDays);

      await Subscription.findOneAndUpdate(
        {
          razorpaySubscriptionId: newSubId,
        },
        {
          status: "authenticated",
          authenticatedPeriodStart: trialStart,
          authenticatedPeriodEnd: trialEnd,
        }
      );

      console.log(
        `Started authenticated trial: ${newSubId}, ${bonusDays} days`
      );
    }

    return { success: true };
  } catch (error) {
    console.error(`Error processing invoice.paid event: ${error.message}`);
    return { success: false };
  }
};

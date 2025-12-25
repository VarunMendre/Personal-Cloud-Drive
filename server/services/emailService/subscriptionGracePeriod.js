import { wrapEmailTemplate, sendEmail } from "./emailBase.js";

/**
 * Sends a reminder during the grace period (pending payment)
 */
export const sendSubscriptionGracePeriodEmail = async (email, userName, daysLeft) => {
  const contentHtml = `
    <p class="text">Hi ${userName},</p>
    <p class="text">This is a friendly reminder that your subscription payment is currently <strong>pending</strong>. Your account is now in a grace period.</p>
    
    <div class="highlight-box" style="border-left: 4px solid #facc15; background-color: #fefce8;">
      <p style="margin: 0; font-weight: 600; color: #854d0e;">Attention Required:</p>
      <p style="margin: 8px 0 0 0; color: #a16207;">You have <strong>${daysLeft} days remaining</strong> in your grace period before your account features are restricted.</p>
    </div>

    <p class="text">To avoid any interruption to your service, please update your payment method or complete the pending transaction.</p>

    <div class="button-wrapper">
      <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/subscription" class="button">Update Payment Method</a>
    </div>

    <p class="text">If you've already made the payment, it might still be processing. Feel free to contact us if you need help.</p>
  `;

  const html = wrapEmailTemplate("Payment Pending", contentHtml, "#eab308"); // Alert Yellow

  return await sendEmail({
    to: email,
    subject: "Reminder: Subscription Payment Pending",
    html,
  });
};

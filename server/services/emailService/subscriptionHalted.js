import { wrapEmailTemplate, sendEmail } from "./emailBase.js";

/**
 * Sends a notification when a subscription is halted (deactivated)
 */
export const sendSubscriptionHaltedEmail = async (email, userName) => {
  const contentHtml = `
    <p class="text">Hi ${userName},</p>
    <p class="text">We regret to inform you that your <strong>Storage Drive subscription has been deactivated</strong> due to consecutive failed payment attempts or manual cancellation.</p>
    
    <div class="highlight-box" style="border-left: 4px solid #ef4444; background-color: #fef2f2;">
      <p style="margin: 0; font-weight: 600; color: #991b1b;">Account Deactivated:</p>
      <p style="margin: 8px 0 0 0; color: #b91c1c;">Your premium storage quota has been revoked. If you are over the free storage limit, you will need to upgrade to regain full access to your files.</p>
    </div>

    <p class="text">To restore your account and prevent any data loss (if applicable), please re-subscribe to one of our plans.</p>

    <div class="button-wrapper">
      <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/plans" class="button">View Plans & Re-subscribe</a>
    </div>

    <p class="text">Stored files will be retained for a limited time according to our policy. Please take action soon.</p>
  `;

  const html = wrapEmailTemplate("Account Deactivated", contentHtml, "#ef4444"); // Error Red

  return await sendEmail({
    to: email,
    subject: "Your Subscription has Been Deactivated",
    html,
  });
};

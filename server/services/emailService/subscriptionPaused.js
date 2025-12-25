import { wrapEmailTemplate, sendEmail } from "./emailBase.js";

/**
 * Sends a notification when a subscription is paused
 */
export const sendSubscriptionPausedEmail = async (email, userName, reason = "payment issue or account review") => {
  const contentHtml = `
    <p class="text">Hi ${userName},</p>
    <p class="text">We're writing to inform you that your <strong>Storage Drive subscription has been paused</strong>.</p>
    
    <div class="highlight-box" style="border-left: 4px solid #f59e0b; background-color: #fffbeb;">
      <p style="margin: 0; font-weight: 600; color: #92400e;">Important Notice:</p>
      <p style="margin: 8px 0 0 0; color: #b45309;">Your account has been paused due to: <strong>${reason}</strong>.</p>
    </div>

    <p class="text">While your subscription is paused, your existing files are safe, but you may have restricted access to uploading or downloading files depending on your current usage.</p>

    <div class="button-wrapper">
      <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/subscription" class="button">Check Account Status</a>
    </div>

    <p class="text">To resolve this and resume your service, please visit your subscription dashboard or contact our support team.</p>
  `;

  const html = wrapEmailTemplate("Subscription Paused", contentHtml, "#f59e0b"); // Warning Orange

  return await sendEmail({
    to: email,
    subject: "Subscription Status Update - Storage Drive",
    html,
    text: `Hi ${userName},\n\nYour Storage Drive subscription has been paused.\n\nYour account has been paused due to: ${reason}.\n\nWhile paused, your files are safe but access might be restricted. Check your status here: ${process.env.CLIENT_URL || "http://localhost:5173"}/subscription`,
  });
};

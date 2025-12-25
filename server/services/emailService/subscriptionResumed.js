import { wrapEmailTemplate, sendEmail } from "./emailBase.js";

/**
 * Sends a notification when a subscription is resumed
 */
export const sendSubscriptionResumedEmail = async (email, userName) => {
  const contentHtml = `
    <p class="text">Hi ${userName},</p>
    <p class="text">Welcome back! Your <strong>Storage Drive subscription has been successfully resumed</strong>.</p>
    
    <div class="highlight-box" style="border-left: 4px solid #3b82f6; background-color: #eff6ff;">
      <p style="margin: 0; font-weight: 600; color: #1e40af;">Service Restored:</p>
      <p style="margin: 8px 0 0 0; color: #1d4ed8;">All premium features and storage limits have been fully restored to your account.</p>
    </div>

    <p class="text">You can now continue managing your files with full access. Thank you for staying with us!</p>

    <div class="button-wrapper">
      <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard" class="button">Go to Dashboard</a>
    </div>

    <p class="text">If you noticed any issues during the transition, please let us know.</p>
  `;

  const html = wrapEmailTemplate("Subscription Resumed!", contentHtml, "#3b82f6"); // Info Blue

  return await sendEmail({
    to: email,
    subject: "Your Service is Back - Storage Drive",
    html,
    text: `Hi ${userName},\n\nWelcome back! Your Storage Drive subscription has been successfully resumed.\n\nAll premium features and storage limits have been fully restored.`,
  });
};

import { wrapEmailTemplate, sendEmail } from "./emailBase.js";

/**
 * Sends a notification email after a subscription cancellation
 */
export const sendSubscriptionCancelledEmail = async (email, userName) => {
    const contentHtml = `
    <p class="text">Hi ${userName},</p>
    <p class="text">This email confirms that your subscription to **Storage Drive** has been successfully cancelled.</p>
    
    <div class="highlight-box">
      <p style="margin: 0; font-weight: 600; color: #0f172a;">What happens next?</p>
      <ul style="margin: 12px 0 0 0; padding-left: 20px; color: #475569;">
        <li>Your account has been reverted to the free tier.</li>
        <li>Your storage limit and device limits have been adjusted.</li>
        <li>Your files are still safe, but you may need to free up space to upload new ones.</li>
      </ul>
    </div>

    <p class="text">We're sorry to see you go! If there's anything we could have done better, we'd love to hear your feedback.</p>

    <div class="button-wrapper">
      <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/plans" class="button">View Plans to Re-subscribe</a>
    </div>

    <p class="text">If you didn't intend to cancel, you can upgrade your plan at any time to restore your premium features.</p>
  `;

    const html = wrapEmailTemplate("Subscription Cancelled", contentHtml, "#64748b"); // Slate Grey
    const text = `Hi ${userName},\n\nYour subscription to Storage Drive has been cancelled. Your account has been reverted to the free tier.\n\nView plans to re-subscribe: ${process.env.CLIENT_URL || "http://localhost:5173"}/plans`;

    return await sendEmail({
        to: email,
        subject: "Subscription Cancellation Confirmation - Storage Drive",
        html,
        text,
    });
};

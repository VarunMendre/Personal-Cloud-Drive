import { wrapEmailTemplate, sendEmail } from "./emailBase.js";

/**
 * Sends a success email after a subscription purchase
 */
export const sendSubscriptionActiveEmail = async (email, userName, planName, storageLimit, invoiceUrl, buttonLabel = "View My Invoice") => {
  const contentHtml = `
    <p class="text">Hi ${userName},</p>
    <p class="text">Great news! Your subscription to the <strong>${planName}</strong> plan is now active. You have successfully upgraded your storage capacity and unlocked premium features.</p>
    
    <div class="highlight-box">
      <p style="margin: 0; font-weight: 600; color: #0f172a;">Plan Details:</p>
      <ul style="margin: 12px 0 0 0; padding-left: 20px; color: #475569;">
        <li>Plan: ${planName}</li>
        <li>Storage: ${storageLimit} GB</li>
        <li>Status: Active</li>
      </ul>
    </div>

    <p class="text">You can now enjoy increased storage and faster access to your files. ${buttonLabel === "View My Invoice" ? "Your invoice is ready for viewing below." : "You can manage your subscription in your dashboard."}</p>

    <div class="button-wrapper">
      <a href="${invoiceUrl || "#"}" class="button">${buttonLabel || "Go to Dashboard"}</a>
    </div>

    <p class="text">If you have any questions about your new plan, feel free to reach out to our support team.</p>
  `;

  const html = wrapEmailTemplate("Subscription Activated!", contentHtml, "#10b981"); // Success Green

  return await sendEmail({
    to: email,
    subject: "Welcome to Premium - Storage Drive",
    html,
    text: `Hi ${userName},\n\nGreat news! Your subscription to the ${planName} plan is now active.\n\nPlan Details:\n- Plan: ${planName}\n- Storage: ${storageLimit} GB\n\nView your invoice here: ${invoiceUrl}`,
  });
};

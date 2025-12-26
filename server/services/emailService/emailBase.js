import { Resend } from "resend";

// Initialize Resend with the provided key (should ideally be from process.env in production)
// Initialize Resend with the provided key
const resend = new Resend(process.env.OTP_RESEND_KEY || process.env.RESEND_API_KEY || "re_Q6KEKoDn_Gveb78JtUkTzZWzQ3krp2E2k");

/**
 * Wraps content in a standard HTML email template
 * @param {string} title - Email title/heading
 * @param {string} contentHtml - Body content in HTML
 * @param {string} themeColor - Hex color for the header/theme
 * @returns {string} - Full HTML string
 */
export const wrapEmailTemplate = (title, contentHtml, themeColor = "#2563EB") => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background-color: ${themeColor}; padding: 40px 20px; text-align: center; }
        .logo { color: #ffffff; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -1px; text-decoration: none; }
        .content { padding: 48px 40px; color: #1e293b; line-height: 1.6; }
        .title { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 24px; text-align: center; }
        .text { font-size: 16px; color: #475569; margin-bottom: 24px; }
        .button-wrapper { text-align: center; margin: 32px 0; }
        .button { background-color: ${themeColor}; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .highlight-box { background-color: #f1f5f9; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
        .footer { background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { font-size: 13px; color: #64748b; margin: 0; }
        .footer a { color: ${themeColor}; text-decoration: none; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <a href="#" class="logo">STORAGE DRIVE</a>
          </div>
          <div class="content">
            ${title ? `<h1 class="title">${title}</h1>` : ""}
            ${contentHtml}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Storage Drive. All rights reserved.</p>
            <p>Managed your account at <a href="${process.env.CLIENT_URL || "#"}">Storage Drive</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Base function to send emails via Resend
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const data = await resend.emails.send({
      from: "Storage Drive <noreply@cloudvault.cloud>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || subject,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Resend Email Error:", error);
    return { success: false, error };
  }
};

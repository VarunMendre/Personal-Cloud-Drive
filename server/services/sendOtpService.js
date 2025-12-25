import { Resend } from "resend";
import OTP from "../models/otpModel.js";

const resend = new Resend(process.env.OTP_RESEND_KEY);

export async function sendOtpService(email) {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Upsert OTP (replace if it already exists)
  await OTP.findOneAndUpdate(
    { email },
    { otp, createdAt: new Date() },
    { upsert: true }
  );

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Storage Drive OTP</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden; }
        .header { background-color: #2563EB; padding: 30px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px; }
        .content { padding: 40px 30px; text-align: center; color: #334155; }
        .content p { font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #475569; }
        .otp-box { background-color: #F1F5F9; border-radius: 8px; padding: 16px 24px; display: inline-block; margin: 0 auto 24px; border: 1px dashed #94A3B8; }
        .otp-code { font-size: 32px; font-weight: 700; color: #1E293B; letter-spacing: 6px; margin: 0; font-family: 'Courier New', monospace; }
        .footer { background-color: #F8FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0; }
        .footer p { font-size: 12px; color: #94A3B8; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Storage Drive</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We received a request to verify your email address. Please use the following One-Time Password (OTP) to complete your registration:</p>
          <div class="otp-box">
            <h2 class="otp-code">${otp}</h2>
          </div>
          <p>This code is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Cloud Storage Drive. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: "Storage App <onboarding@resend.dev>",
    to: email,
    subject: "Storage App OTP",
    html,
  });

  return { success: true, message: `OTP sent successfully on ${email} `};
}

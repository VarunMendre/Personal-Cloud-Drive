import { Resend } from "resend";
import OTP from "../models/otpModel.js";

const resend = new Resend("re_Q6KEKoDn_Gveb78JtUkTzZWzQ3krp2E2k");

export async function sendOtp(email) {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Upsert OTP (replace if it already exists)
  await OTP.findOneAndUpdate(
    { email },
    { otp, createdAt: new Date() },
    { upsert: true, new: true }
  );

  const html = `
    <div style="font-family:sans-serif;">
      <h2>Your OTP is: ${otp}</h2>
      <p>This OTP is valid for 10 minutes.</p>
    </div>
  `;

  await resend.emails.send({
    from: "Storage App <otp@procodrr.dev>",
    to: email,
    subject: "Storage App OTP",
    html,
  });

  return { success: true, message: "OTP sent successfully" };
}

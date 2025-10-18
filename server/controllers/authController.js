import { sendOtpService } from "../services/sendOtpService.js";
import OTP from "../models/otpModel.js";

export const sendOtp = async (req, res, next) => {
  const { email } = req.body;
  console.log(email);
  const resData = await sendOtpService(email);
  res.status(201).json(resData);
};

export const verifyOtp =  async (req, res, next) => {
    const { email, otp } = req.body;
    const optRecord = await OTP.findOne({ email, otp });
    if (!optRecord) {
        return res.status(400).json({ error: "Invalid or Expired OTP" });
    }


    res.json({ message: "OTP verified" });
}
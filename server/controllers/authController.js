import { sendOtpService } from "../services/sendOtpService.js";
import OTP from "../models/otpModel.js";
import { OAuth2Client } from "google-auth-library";
import { verifyIdToken } from "../services/googleAuthService.js";
import User from "../models/userModel.js";
import mongoose,{Types} from "mongoose";
import Directory from "../models/directoryModel.js";
import Session from "../models/sessionModel.js";

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

export const loginWithGoogle = async (req, res, next) => {
  const { idToken } = req.body;
  
  const userData = await verifyIdToken(idToken);
  
  const { name, email, picture, sub } = userData;
  
  const user = await User.findOne({ email }).select("-__v");

  if (user) {
    const allSessions = await Session.find({ userId: user.id });

    if (allSessions.length >= 2) {
      await allSessions[0].deleteOne();
    }

    if (user.picture.includes("googleusercontent.com")) {
      user.picture = picture;
      await user.save()
    }

    const session = await Session.create({ userId: user._id });

    res.cookie("sid", session.id, {
      httpOnly: true,
      signed: true,
      maxAge: 60 * 1000 * 60 * 24 * 7,
    });
    return res
      .json({ message: "logged in" });
  }
  console.log("user doesn't exits");
  const mongooseSession = await mongoose.startSession();
  
    try {
      const rootDirId = new Types.ObjectId();
      const userId = new Types.ObjectId();
  
      mongooseSession.startTransaction();
  
      await Directory.insertOne(
        {
          _id: rootDirId,
          name: `root-${email}`,
          parentDirId: null,
          userId,
        },
        { mongooseSession }
      );
  
      const newUser = await User.insertOne(
        {
          _id: userId,
          name,
          email,
          picture,
          rootDirId,
        },
        { mongooseSession }
      );

      const session = await Session.create({ userId: user._id });
      res.cookie("sid", session.id, {
        httpOnly: true,
        signed: true,
        maxAge: 60 * 1000 * 60 * 24 * 7,
      });
      mongooseSession.commitTransaction();
      res.status(201).json({ message: "logged in", insertedUser: newUser });
    } catch (err) {
      mongooseSession.abortTransaction();
      next(err);
    }
}
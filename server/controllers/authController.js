import { sendOtpService } from "../services/sendOtpService.js";
import OTP from "../models/otpModel.js";
import { verifyIdToken } from "../services/googleAuthService.js";
import User from "../models/userModel.js";
import mongoose, { Types } from "mongoose";
import Directory from "../models/directoryModel.js";
import Session from "../models/sessionModel.js";
import axios from "axios";
import redisClient from "../config/redis.js";

export const sendOtp = async (req, res, next) => {
  const { email } = req.body;
  console.log(email);
  const resData = await sendOtpService(email);
  res.status(201).json(resData);
};

export const verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;
  const optRecord = await OTP.findOne({ email, otp });
  if (!optRecord) {
    return res.status(400).json({ error: "Invalid or Expired OTP" });
  }

  res.json({ message: "OTP verified" });
};

export const loginWithGoogle = async (req, res, next) => {
  const { idToken } = req.body;

  const userData = await verifyIdToken(idToken);

  const { name, email, picture, sub } = userData;

  const user = await User.findOne({ email }).select("-__v");

  if (user) {
    if (user.isDeleted) {
      return res.status(403).json({
        error: "Your account has been deleted. Contact Apps admin to recovery",
      });
    }

    // const allSessions = await Session.find({ userId: user.id });

    // if (allSessions.length >= 2) {
    //   await allSessions[0].deleteOne();
    // }

    if (user.picture && user.picture.includes("googleusercontent.com")) {
      user.picture = picture;
      await user.save();
    }

    const sessionId = crypto.randomUUID();
    const redisKey = `session:${sessionId}`;

    await redisClient.json.set(redisKey, "$", {
      userId: user._id,
      rootDirId: user.rootDirId,
    });

    await redisClient.expire(redisKey, 60 * 60 * 24 * 7);
    res.cookie("sid",sessionId, {
      httpOnly: true,
      signed: true,
      maxAge: 60 * 1000 * 60 * 24 * 7,
    });
    return res.json({ message: "logged in" });
  }

  console.log("user doesn't exits");
  const mongooseSession = await mongoose.startSession();

  try {
    mongooseSession.startTransaction();

    const rootDirId = new Types.ObjectId();
    const userId = new Types.ObjectId();

    const [newUser] = await User.create(
      [
        {
          _id: userId,
          name,
          email,
          picture,
          rootDirId,
        },
      ],
      { session: mongooseSession }
    );

    await Directory.create(
      [
        {
          _id: rootDirId,
          name: `root-${email}`,
          parentDirId: null,
          userId,
          sharedWith: [],
          shareLink: {
            enabled: false,
            token: null,
            role: "viewer",
            createdAt: null,
          },
        },
      ],
      { session: mongooseSession }
    );

    const sessionId = crypto.randomUUID();
    const redisKey = `session:${sessionId}`;

    await redisClient.json.set(redisKey, "$", {
      userId: user._id,
      rootDirId: user.rootDirId,
    });

    await redisClient.expire(redisKey, 60 * 60 * 24 * 7);
    res.cookie("sid", sessionId, {
      httpOnly: true,
      signed: true,
      maxAge: 60 * 1000 * 60 * 24 * 7,
    });

    await mongooseSession.commitTransaction();
    mongooseSession.endSession();

    res.status(201).json({ message: "logged in", insertedUser: newUser });
  } catch (err) {
    await mongooseSession.abortTransaction();
    mongooseSession.endSession();
    next(err);
  }
};

export async function githubLogin(req, res, next) {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Code is required" });

  const CLIENT_ID = "Ov23lifBnGMie0EjK9Zz";
  const CLIENT_SECRET = "fed6f373bc20e2dddc4e9b5eaf8c0101dc90c60a";

  try {
    // 1 Exchange code for access token
    const tokenResp = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: "application/json" },
      }
    );

    const accessToken = tokenResp.data.access_token;
    if (!accessToken) return res.status(400).json({ error: "No access token" });

    // 2️ Fetch user info
    const userResp = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `token ${accessToken}` },
    });

    // 3️ Fetch primary email
    let email = null;
    try {
      const emailsResp = await axios.get("https://api.github.com/user/emails", {
        headers: { Authorization: `token ${accessToken}` },
      });
      email = emailsResp.data.find((e) => e.primary)?.email || null;
    } catch (err) {
      console.warn("Could not fetch GitHub email:", err.message);
    }

    const { name } = userResp.data;
    const picture = userResp.data.avatar_url || "default-avatar-url";

    if (!email)
      return res.status(400).json({ error: "Email not available from GitHub" });

    // 4️ Check if user exists
    let user = await User.findOne({ email }).select("-__v");

    if (user) {
      // Manage sessions
      const allSessions = await Session.find({ userId: user._id });
      if (allSessions.length >= 2) await allSessions[0].deleteOne();

      // Update avatar if default
      if (user.picture.includes("avatars.githubusercontent")) {
        user.picture = picture;
        await user.save();
      }

      const sessionId = crypto.randomUUID();
      const redisKey = `session:${sessionId}`;

      await redisClient.json.set(redisKey, "$", {
        userId: user._id,
        rootDirId: user.rootDirId,
      });

      await redisClient.expire(redisKey, 60 * 60 * 24 * 7);
      res.cookie("sid", sessionId, {
        httpOnly: true,
        signed: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      return res.json({ message: "logged in", user });
    }

    // 5️ If user doesn't exist, create user and root directory
    console.log("user doesn't exist");
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const rootDirId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      //  Include sharedWith and shareLink fields
      const rootDir = await Directory.create(
        [
          {
            _id: rootDirId,
            name: `root-${email}`,
            parentDirId: null,
            userId,
            sharedWith: [],
            shareLink: {
              enabled: false,
              token: null,
              role: "viewer",
              createdAt: null,
            },
          },
        ],
        { session }
      );

      user = await User.create(
        [{ _id: userId, name, email, picture, rootDirId }],
        { session }
      );

      const sessionId = crypto.randomUUID();
      const redisKey = `session:${sessionId}`;

      await redisClient.json.set(redisKey, "$", {
        userId: user._id,
        rootDirId: user.rootDirId,
      });

      await redisClient.expire(redisKey, 60 * 60 * 24 * 7);

      res.cookie("sid", sessionId, {
        httpOnly: true,
        signed: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      await session.commitTransaction();
      session.endSession();

      console.log("✅ User and root directory created successfully");
      res.status(201).json({ message: "logged in", user: user[0] });
    } catch (err) {
      console.error("Transaction error:", err.message);

      // ✅ ADDED: Detailed error logging
      if (err.code === 121 && err.errInfo) {
        console.error("Validation error details:");
        console.error(JSON.stringify(err.errInfo.details, null, 2));
      }

      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    console.error("GitHub login error:", err.response?.data || err.message);
    res.status(500).json({ error: "GitHub login failed" });
  }
}

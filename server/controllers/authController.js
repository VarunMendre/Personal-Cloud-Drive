import { sendOtpService } from "../services/sendOtpService.js";
import OTP from "../models/otpModel.js";
import { verifyIdToken } from "../services/googleAuthService.js";
import User from "../models/userModel.js";
import mongoose, { Types } from "mongoose";
import Directory from "../models/directoryModel.js";
import axios, { all } from "axios";
import redisClient from "../config/redis.js";
import {
  githubLoginSchema,
  googleLoginSchema,
  otpSchema,
} from "../validators/authSchema.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { validateWithSchema } from "../utils/validationWrapper.js";
import { runInTransaction } from "../utils/transactionHelper.js";

export const sendOtp = async (req, res, next) => {
  const { email } = req.body;
  const resData = await sendOtpService(email);
  return successResponse(res, resData, null, 201);
};

export const verifyOtp = async (req, res, next) => {
  const { success, data } = validateWithSchema(otpSchema, req.body);

  if (!success) {
    return errorResponse(res, "Invalid or Expired OTP", 400);
  }

  const { email, otp } = data;
  const optRecord = await OTP.findOne({ email, otp });
  if (!optRecord) {
    return errorResponse(res, "Invalid or Expired OTP", 400);
  }

  return successResponse(res, null, "OTP verified");
};

export const loginWithGoogle = async (req, res, next) => {
  const { idToken } = req.body;

  if (!idToken) {
    return errorResponse(res, "Id Token not generated", 400);
  }

  const userData = await verifyIdToken(idToken);
  const { name, email, picture } = userData;

  const { success } = validateWithSchema(googleLoginSchema, {
    name,
    email,
    picture,
  });

  if (!success) {
    return errorResponse(res, "Invalid credentials", 400);
  }

  let user = await User.findOne({ email }).select("-__v");

  // ✅ If user exists
  if (user) {
    if (user.isDeleted) {
      return errorResponse(res, "Your account has been deleted. Contact admin to recover it.", 403);
    }

    const maxDevicesLimit = user.maxDevices;
    const allSession = await redisClient.ft.search(
      "userIdInx",
      `@userId:{${user.id}}`,
      { RETURN: [] }
    );

    if (allSession.total >= maxDevicesLimit) {
      await redisClient.del(allSession.documents[0].id);
    }

    if (user.picture && user.picture.includes("googleusercontent.com")) {
      user.picture = picture;
      await user.save();
    }

    const sessionId = crypto.randomUUID();
    const redisKey = `session:${sessionId}`;

    await redisClient.json.set(redisKey, "$", {
      userId: user._id,
      rootDirId: user.rootDirId,
      role: user.role,
    });

    await redisClient.expire(redisKey, 60 * 60 * 24 * 7);
    res.cookie("sid", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      signed: true,
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });

    return successResponse(res, null, "logged in");
  }

  // ✅ If user doesn't exist
  try {
    const result = await runInTransaction(async (session) => {
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
        { session }
      );

      await Directory.create(
        [
          {
            _id: rootDirId,
            name: `root-${email}`,
            parentDirId: null,
            userId,
          },
        ],
        { session }
      );

      return newUser;
    });

    const allSession = await redisClient.ft.search(
      "userIdInx",
      `@userId:{${result.id}}`,
      { RETURN: [] }
    );

    const maxDevicesLimit = result.maxDevices;

    if (allSession.total >= maxDevicesLimit) {
      await redisClient.del(allSession.documents[0].id);
    }

    const sessionId = crypto.randomUUID();
    const redisKey = `session:${sessionId}`;

    await redisClient.json.set(redisKey, "$", {
      userId: result._id,
      rootDirId: result.rootDirId,
      role: "User",
    });

    await redisClient.expire(redisKey, 60 * 60 * 24 * 7);
    res.cookie("sid", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      signed: true,
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });

    return successResponse(res, { insertedUser: result }, "logged in", 201);
  } catch (err) {
    next(err);
  }
};

export async function githubLogin(req, res, next) {
  const { code } = req.body;
  if (!code) return errorResponse(res, "Code is required", 400);

  const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

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
    if (!accessToken) return errorResponse(res, "No access token", 400);

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

    const { success } = validateWithSchema(githubLoginSchema, {
      name,
      email,
      picture,
    });

    if (!success) {
      return errorResponse(res, "Invalid Credentials", 400);
    }

    if (!email)
      return errorResponse(res, "Email not available from GitHub", 400);

    // 4️ Check if user exists
    let user = await User.findOne({ email }).select("-__v");
    if (user) {

      const maxDevicesLimit = user.maxDevices;
      // Manage sessions
      const allSession = await redisClient.ft.search(
        "userIdInx",
        `@userId:{${user.id}}`,
        {
          RETURN: [],
        }
      );

      if (allSession.total >= maxDevicesLimit) {
        await redisClient.del(allSession.documents[0].id);
      }

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
        role: user.role,
      });

      await redisClient.expire(redisKey, 60 * 60 * 24 * 7);
      res.cookie("sid", sessionId, {
        httpOnly: true,
        sameSite: "lax",
        signed: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      return successResponse(res, { user }, "logged in");
    }

    // 5️ If user doesn't exist, create user and root directory
    try {
      const result = await runInTransaction(async (session) => {
        const rootDirId = new Types.ObjectId();
        const userId = new Types.ObjectId();

        await Directory.create(
          [
            {
              _id: rootDirId,
              name: `root-${email}`,
              parentDirId: null,
              userId,
            },
          ],
          { session }
        );

        const newUser = await User.create(
          [{ _id: userId, name, email, picture, rootDirId }],
          { session }
        );
        return newUser[0];
      });

      const allSession = await redisClient.ft.search(
        "userIdInx",
        `@userId:{${result.id}}`,
        {
          RETURN: [],
        }
      );

      const maxDevicesLimit = result.maxDevices;
      if (allSession.total >= maxDevicesLimit) {
        await redisClient.del(allSession.documents[0].id);
      }
      const sessionId = crypto.randomUUID();
      const redisKey = `session:${sessionId}`;

      await redisClient.json.set(redisKey, "$", {
        userId: result._id,
        rootDirId: result.rootDirId,
        role: result.role,
      });

      await redisClient.expire(redisKey, 60 * 60 * 24 * 7);

      res.cookie("sid", sessionId, {
        httpOnly: true,
        sameSite: "lax",
        signed: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      return successResponse(res, { user: result }, "logged in", 201);
    } catch (err) {
      console.error("Transaction error:", err.message);
      throw err;
    }
  } catch (err) {
    console.error("GitHub login error:", err.response?.data || err.message);
    return errorResponse(res, "GitHub login failed", 500);
  }
}

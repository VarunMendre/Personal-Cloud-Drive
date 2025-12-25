import { sendOtpService } from "../services/sendOtpService.js";
import OTP from "../models/otpModel.js";
import { verifyIdToken } from "../services/googleAuthService.js";
import { getGitHubUser } from "../services/githubAuthService.js";
import User from "../models/userModel.js";
import mongoose, { Types } from "mongoose";
import Directory from "../models/directoryModel.js";
import {
  registerSchema,
  githubLoginSchema,
  googleLoginSchema,
  otpSchema,
} from "../validators/authSchema.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { validateWithSchema } from "../utils/validationWrapper.js";
import { runInTransaction } from "../utils/transactionHelper.js";
import { deleteUserSessions, createSession } from "../utils/authUtils.js";

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

    if (user.picture && user.picture.includes("googleusercontent.com")) {
      user.picture = picture;
      await user.save();
    }

    await createSession(res, user);

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

    await createSession(res, result);

    return successResponse(res, { insertedUser: result }, "logged in", 201);
  } catch (err) {
    next(err);
  }
};

export async function githubLogin(req, res, next) {
  const { code } = req.body;
  if (!code) return errorResponse(res, "Code is required", 400);

  try {
    const { name, email, picture } = await getGitHubUser(code);

    const { success } = validateWithSchema(githubLoginSchema, {
      name,
      email,
      picture,
    });

    if (!success || !email) {
      return errorResponse(res, "Invalid Credentials or Email not available from GitHub", 400);
    }

    // Check if user exists
    let user = await User.findOne({ email }).select("-__v");

    if (user) {
      // Update avatar if default
      if (user.picture.includes("avatars.githubusercontent")) {
        user.picture = picture;
        await user.save();
      }

      await createSession(res, user);
      return successResponse(res, { user }, "logged in");
    }

    // If user doesn't exist, create user and root directory
    const result = await runInTransaction(async (session) => {
      const rootDirId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      await Directory.create([{
        _id: rootDirId,
        name: `root-${email}`,
        parentDirId: null,
        userId,
      }], { session });

      const newUser = await User.create([{
        _id: userId,
        name,
        email,
        picture,
        rootDirId
      }], { session });

      return newUser[0];
    });

    await createSession(res, result);
    return successResponse(res, { user: result }, "logged in", 201);
  } catch (err) {
    console.error("GitHub login error:", err.message);
    return errorResponse(res, "GitHub login failed", 500);
  }
}

import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";
import User from "../models/userModel.js";
import { rm } from "fs/promises";
import mongoose, { Types } from "mongoose";
import OTP from "../models/otpModel.js";
import Subscription from "../models/subscriptionModel.js";
import { getEditableRoles } from "../utils/permissions.js";
import redisClient from "../config/redis.js";
import { loginSchema, registerSchema } from "../validators/authSchema.js";
import { getFileUrl } from "../services/s3.js";
import { createCloudFrontSignedGetUrl } from "../services/cloudFront.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { sanitize } from "../utils/sanitizer.js";
import { validateWithSchema } from "../utils/validationWrapper.js";
import { runInTransaction } from "../utils/transactionHelper.js";
import { deleteUserSessions, createSession } from "../utils/authUtils.js";

export const register = async (req, res, next) => {
  const sanitizedBody = sanitize(req.body);

  const { success, data, fieldErrors } = validateWithSchema(registerSchema, sanitizedBody);

  if (!success) {
    return errorResponse(res, "Validation failed", 400, { fieldErrors });
  }

  const { name, email, password, otp } = data;
  const optRecord = await OTP.findOne({ email, otp });
  if (!optRecord) {
    return errorResponse(res, "Invalid or Expired OTP", 400);
  }
  await optRecord.deleteOne();

  try {
    await runInTransaction(async (session) => {
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

      await User.create(
        [
          {
            _id: userId,
            name,
            email,
            password,
            rootDirId,
          },
        ],
        { session }
      );
    });

    return successResponse(res, null, "User Registered", 201);
  } catch (err) {
    console.log(err);
    if (err.code === 121) {
      return errorResponse(res, "Invalid input, please enter valid details", 400);
    } else if (err.code === 11000) {
      if (err.keyValue.email) {
        return errorResponse(res, "This email already exists", 409, {
          message: "A user with this email address already exists. Please try logging in or use a different email.",
        });
      }
    } else {
      next(err);
    }
  }
};

export const login = async (req, res, next) => {
  const sanitizedBody = sanitize(req.body);

  const { success, data } = validateWithSchema(loginSchema, sanitizedBody);

  if (!success) {
    return errorResponse(res, "Invalid Credentials", 404);
  }

  const { email, password } = data;

  if (!email || !password) {
    return errorResponse(res, "Email and password are required", 400);
  }
  const user = await User.findOne({ email, isDeleted: false });

  if (!user) {
    return errorResponse(res, "Invalid Credentials", 404);
  }

  // CHECK: If user doesn't have a password (OAuth user who hasn't set password)
  if (!user.password || user.password.length === 0) {
    return errorResponse(res, "No password set. Please login with Google/GitHub or set a password in settings.", 401);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return errorResponse(res, "Invalid Credentials", 404);
  }

  await createSession(res, user);
  return successResponse(res, null, "logged in");
};

export const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return errorResponse(res, "User not found", 404);
  }

  const userDir = await Directory.findById(user.rootDirId);

  return successResponse(res, {
    name: user.name,
    email: user.email,
    picture: user.picture,
    role: user.role,
    subscriptionId: user.subscriptionId,
    maxStorageLimit: user.maxStorageLimit,
    usedStorageInBytes: userDir ? userDir.size : 0,
    subscriptionStatus: user.subscriptionId ? (await Subscription.findOne({ razorpaySubscriptionId: user.subscriptionId }))?.status || "none" : "none",
  });
};

export const logout = async (req, res) => {
  const { sid } = req.signedCookies;
  await redisClient.del(`session:${sid}`);
  res.clearCookie("sid", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    signed: true,
  });
  res.status(204).end();
};

export const logoutAll = async (req, res) => {
  const { _id: userId } = req.user;
  try {
    await deleteUserSessions(userId.toString());
    res.clearCookie("sid");
    res.status(204).end();
  } catch (err) {
    return errorResponse(res, "Logout failed", 500);
  }
};

export const logOutById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await deleteUserSessions(userId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const getUserPassword = async (req, res, next) => {
  try {
    // req.user is already populated by checkAuth middleware
    const hasPassword = req.user.password && req.user.password.length > 0;

    return successResponse(res, { hasPassword });
  } catch (err) {
    console.error("Error checking password:", err);
    return errorResponse(res, "Error checking password status", 500);
  }
};

export const setUserPassword = async (req, res, next) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword < 4) {
    return errorResponse(res, "Password must be at least 4 characters long", 400);
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return errorResponse(res, "User not Found", 404);
    }

    if (user.password && user.password.length > 0) {
      return errorResponse(res, "Password already set. Use change password instead.", 400);
    }
    user.password = newPassword;
    await user.save();

    return successResponse(res, null, "Password Set Successfully, You may now login with credentials");
  } catch (err) {
    console.error("Error setting password:", err);
    return errorResponse(res, "Error setting password", 500);
  }
};

export const changeUserPassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return errorResponse(res, "Current and new passwords are required", 400);
  }

  if (newPassword.length < 4) {
    return errorResponse(res, "New password must be at least 4 characters long", 400);
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    if (!user.password || user.password.length === 0) {
      return errorResponse(res, "No existing password set. Please set a password first.", 400);
    }

    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return errorResponse(res, "Current password is incorrect", 400);
    }

    user.password = newPassword;
    await user.save();

    return successResponse(res, null, "Password changed successfully");
  } catch (err) {
    return errorResponse(res, "Error changing password", 500);
  }
};

export const getAllUsers = async (req, res) => {
  const requestorRole = req.user.role;

  let query = { isDeleted: false };

  if (requestorRole === "Owner") {
    query = {};
  }

  if (requestorRole !== "Owner") {
    query.role = { $ne: "Owner" };
  }

  const allUsers = await User.find(query).lean();

  const userIds = allUsers.map(u => u._id);
  const rootDirs = await Directory.find({ userId: { $in: userIds }, parentDirId: null }).lean();

  const storageMap = {};
  rootDirs.forEach((dir) => {
    storageMap[dir.userId.toString()] = dir.size || 0;
  });


  const keys = await redisClient.keys("session:*");
  const allSessionsUserIdSet = new Set();


  if (keys.length > 0) {
    const session = await Promise.all(
      keys.map((key) => redisClient.json.get(key))
    );

    session.forEach((session) => {
      if (session && session.userId) {
        allSessionsUserIdSet.add(session.userId.toString());
      }
    });
  }

  // Fetch subscription data for these users
  const subscriptions = await Subscription.find({ userId: { $in: userIds } }).sort({ createdAt: -1 }).lean();
  const subscriptionMap = {};
  subscriptions.forEach(sub => {
    // Only keep the most recent one per user (since we sorted by createdAt: -1)
    if (!subscriptionMap[sub.userId.toString()]) {
      subscriptionMap[sub.userId.toString()] = {
        status: sub.status,
        razorpaySubscriptionId: sub.razorpaySubscriptionId
      };
    }
  });

  const transformedUsers = allUsers.map(({ _id, name, email, role, isDeleted, maxStorageLimit, subscriptionId }) => ({
    id: _id,
    name,
    email,
    role,
    isLoggedIn: allSessionsUserIdSet.has(_id.toString()),
    isDeleted: isDeleted || false,
    usedStorageInBytes: storageMap[_id.toString()] || 0,
    maxStorageLimit: maxStorageLimit || 0,
    subscriptionStatus: subscriptionMap[_id.toString()]?.status || "none",
    razorpaySubscriptionId: subscriptionMap[_id.toString()]?.razorpaySubscriptionId || subscriptionId || null
  }));

  return successResponse(res, transformedUsers);
};

export const softDeleteUser = async (req, res, next) => {
  const { userId } = req.params;
  if (req.user._id.toString() === userId) {
    return errorResponse(res, "You cannot delete your self", 403);
  }

  try {
    await runInTransaction(async (session) => {
      await User.findByIdAndUpdate({ _id: userId }, { isDeleted: true }, { session });
      await deleteUserSessions(userId);
    });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const hardDeleteUser = async (req, res, next) => {
  const { userId } = req.params;
  if (req.user._id.toString() === userId) {
    return errorResponse(res, "You cannot delete your self", 403);
  }

  if (req.user.role !== "Owner" && req.user.role !== "Admin") {
    return errorResponse(res, "You don't have permission to hard delete users", 403);
  }

  try {
    await runInTransaction(async (session) => {
      const files = await File.find({ userId }).select("_id extension").lean();

      for (const { _id, extension } of files) {
        const filePath = `${import.meta.dirname}/../storage/${_id.toString()}${extension}`;
        try {
          await rm(filePath, { force: true });
        } catch (err) {
          if (err.code !== "ENOENT") throw err;
        }
      }

      await File.deleteMany({ userId }, { session });
      await Directory.deleteMany({ userId }, { session });
      await User.deleteOne({ _id: userId }, { session });
    });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const recoverUser = async (req, res, next) => {
  const { userId } = req.params;
  if (req.user._id.toString() === userId) {
    return errorResponse(res, "You cannot delete your self", 403);
  }

  try {
    await runInTransaction(async (session) => {
      await User.findByIdAndUpdate(
        { _id: userId },
        { isDeleted: false },
        { session }
      );
    });

    return successResponse(res, null, `User has been recovered with UID: ${userId}`);
  } catch (err) {
    next(err);
  }
};

export const permissionPage = async (req, res, next) => {
  const loggedInUser = req.user;

  if (loggedInUser.role === "User") {
    return errorResponse(res, "Access denied: inSufficient permission", 403);
  }

  const editableRoles = getEditableRoles(loggedInUser.role);
  try {
    const users = await User.find({
      _id: { $ne: loggedInUser._id },
      role: { $in: editableRoles },
    }).select("name email role");

    return successResponse(res, {
      editableRoles,
      users,
    });
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req, res, next) => {
  const { userId } = req.params;
  const { role } = req.body;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  if (currentUserId === userId) {
    return errorResponse(res, "Cannot change you're own role!", 403);
  }

  try {
    const targetedUser = await User.findById(userId);

    if (!targetedUser) {
      return errorResponse(res, "User not found", 404);
    }

    const editableRoles = getEditableRoles(currentUserRole);

    if (!editableRoles.includes(role)) {
      return errorResponse(res, `You can only assign these roles: ${editableRoles.join(", ")}`, 403);
    }

    targetedUser.role = role;
    await targetedUser.save();

    return successResponse(res, {
      user: {
        id: targetedUser._id,
        name: targetedUser.name,
        email: targetedUser.email,
        role: targetedUser.role,
      },
    }, "Role updated successfully");
  } catch (err) {
    next(err);
  }
};

export const getUserFiles = async (req, res, next) => {
  const { userId } = req.params;
  const loggedInUser = req.user;

  if (!["Owner", "Admin"].includes(loggedInUser.role)) {
    return errorResponse(res, "Access denied", 403);
  }

  try {
    const files = await File.find({ userId }).lean();

    return successResponse(res, files);
  } catch (err) {
    next(err);
  }
};

export const deleteUserFiles = async (req, res, next) => {
  const { userId, fileId } = req.params;
  const loggedInUser = req.user;

  if (loggedInUser.role !== "Owner") {
    return errorResponse(res, "Only Owner can delete files", 403);
  }

  try {
    const file = await File.findOneAndDelete({ _id: fileId, userId });

    if (!file) {
      return errorResponse(res, "File not found", 404);
    }
    console.log("File deleted:", file);

    return successResponse(res, null, "File deleted successfully");
  } catch (err) {
    next(err);
  }
};

export const getUserFileView = async (req, res, next) => {
  const { userId, fileId } = req.params;
  const loggedInUser = req.user;

  if (!["Owner", "Admin"].includes(loggedInUser.role)) {
    return errorResponse(res, "Access denied", 403);
  }

  try {
    const fileData = await File.findOne({
      _id: fileId,
      userId: userId,
    }).lean();

    if (!fileData) {
      return errorResponse(res, "File not found", 404);
    }

    const s3Key = `${fileId}${fileData.extension}`;

    if (req.query.action === "download") {
      const getUrl = await getFileUrl({
        Key: s3Key,
        download: true,
        filename: fileData.name,
      });
      return res.redirect(getUrl);
    }

    const getUrl = createCloudFrontSignedGetUrl({
      key: s3Key,
      filename: fileData.name,
    });

    if (req.query.format === "json") {
      return successResponse(res, { url: getUrl });
    }

    return res.redirect(getUrl);
  } catch (err) {
    next(err);
  }
};

export const updateUserFile = async (req, res, next) => {
  const { userId, fileId } = req.params;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return errorResponse(res, "File name is required", 400);
  }

  try {
    const file = await File.findOne({
      _id: fileId,
      userId: userId,
    });

    if (!file) {
      return errorResponse(res, "File not found", 404);
    }

    file.name = name.trim();
    await file.save();

    return successResponse(res, null, "File renamed successfully");
  } catch (err) {
    next(err);
  }
};

export const getUserList = async (req, res, next) => {
  try {
    // Exclude deleted users and return only the basic fields needed by the UI
    const users = await User.find(
      { isDeleted: false },
      { _id: 1, name: 1, email: 1, picture: 1 }
    );

    const usersList = users.map((user) => ({
      userId: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture || "",
    }));

    return successResponse(res, usersList);
  } catch (err) {
    return errorResponse(res, "Failed to fetch users", 500);
  }
};

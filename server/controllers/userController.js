import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";
import User from "../models/userModel.js";
import { rm } from "fs/promises";
import mongoose, { Types } from "mongoose";
import OTP from "../models/otpModel.js";
import { getEditableRoles } from "../utils/permissions.js";
import redisClient from "../config/redis.js";
import { loginSchema, registerSchema } from "../validators/authSchema.js";
import z from "zod";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
import { getFileUrl } from "../services/s3.js";
import { createCloudFrontSignedGetUrl } from "../services/cloudFront.js";

let DOMPurify;

const getDOMPurify = () => {
  if (!DOMPurify) {
    const window = new JSDOM("").window;
    DOMPurify = createDOMPurify(window);
  }
  return DOMPurify;
};

export const register = async (req, res, next) => {
  const sanitizedBody ={
    name: getDOMPurify().sanitize(req.body.name),
    email: getDOMPurify().sanitize(req.body.email),
    password: getDOMPurify().sanitize(req.body.password),
    otp: getDOMPurify().sanitize(req.body.otp),
  };
  
  const {
    success,
    data = content,
    error,
  } = registerSchema.safeParse(sanitizedBody);

  if (!success) {
    return res.status(400).json({ error: z.flattenError(error).fieldErrors });
  }

  const { name, email, password, otp } = data;
  const optRecord = await OTP.findOne({ email, otp });
  if (!optRecord) {
    return res.status(400).json({ error: "Invalid or Expired OTP" });
  }
  await optRecord.deleteOne();

  const session = await mongoose.startSession();

  try {
    const rootDirId = new Types.ObjectId();
    const userId = new Types.ObjectId();

    session.startTransaction();

    await Directory.insertOne(
      {
        _id: rootDirId,
        name: `root-${email}`,
        parentDirId: null,
        userId,
      },
      { session }
    );

    await User.insertOne(
      {
        _id: userId,
        name,
        email,
        password,
        rootDirId,
      },
      { session }
    );

    session.commitTransaction();

    res.status(201).json({ message: "User Registered" });
  } catch (err) {
    session.abortTransaction();
    console.log(err);
    if (err.code === 121) {
      res
        .status(400)
        .json({ error: "Invalid input, please enter valid details" });
    } else if (err.code === 11000) {
      if (err.keyValue.email) {
        return res.status(409).json({
          error: "This email already exists",
          message:
            "A user with this email address already exists. Please try logging in or use a different email.",
        });
      }
    } else {
      next(err);
    }
  }
};

export const login = async (req, res, next) => {
  const sanitizedBody = {
    email: getDOMPurify().sanitize(req.body.email),
    password: getDOMPurify().sanitize(req.body.password),
  };

  const { success, data, error } = loginSchema.safeParse(sanitizedBody);
  
  if (!success) {
    return res.status(404).json({ error: "Invalid Credentials" });
  }

  const { email, password } = data;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }
  const user = await User.findOne({ email, isDeleted: false });

  if (!user) {
    return res.status(404).json({ error: "Invalid Credentials" });
  }

  // CHECK: If user doesn't have a password (OAuth user who hasn't set password)
  if (!user.password || user.password.length === 0) {
    return res.status(401).json({
      error:
        "No password set. Please login with Google/GitHub or set a password in settings.",
    });
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return res.status(404).json({ error: "Invalid Credentials" });
  }

  const allSessions = await redisClient.ft.search(
    "userIdInx",
    `@userId:{${user.id}}`,
    {
      RETURN: [],
    }
  );

  if (allSessions.total >= 2) {
    await redisClient.del(allSessions.documents[0].id);
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
    maxAge: 60 * 1000 * 60 * 24 * 7,
  });
  res.json({ message: "logged in" });
};

export const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  
  const userDir = await Directory.findById(user.rootDirId);
  
  res.status(200).json({
    name: user.name,
    email: user.email,
    picture: user.picture,
    role: user.role,
    subscriptionId: user.subscriptionId,
    maxStorageLimit: user.maxStorageLimit,
    usedStorageInBytes: userDir ? userDir.size : 0,
  });
};

export const logout = async (req, res) => {
  const { sid } = req.signedCookies;
  await redisClient.del(`session:${sid}`);
  res.clearCookie("sid");
  res.status(204).end();
};

export const logoutAll = async (req, res) => {
  const { sid } = req.signedCookies;
  const session = await Session.findById(sid);
  await Session.deleteMany({ userId: session.userId });
  res.clearCookie("sid");
  res.status(204).end();
};

export const logOutById = async (req, res, next) => {
  try {
    await Session.deleteMany({ userId: req.params.userId });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const getUserPassword = async (req, res, next) => {
  try {
    // req.user is already populated by checkAuth middleware
    const hasPassword = req.user.password && req.user.password.length > 0;

    res.json({ hasPassword });
  } catch (err) {
    console.error("Error checking password:", err);
    res.status(500).json({ message: "Error checking password status" });
  }
};

export const setUserPassword = async (req, res, next) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword < 4) {
    return res.status(400).json({
      message: "Password must be at least 4 characters long",
    });
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "User not Found" });
    }

    if (user.password && user.password.length > 0) {
      return res.status(400).json({
        message: "Password already set. Use change password instead.",
      });
    }
    user.password = newPassword;
    await user.save();

    return res.json({
      message: "Password Set Successfully, You may now login with credentials",
    });
  } catch (err) {
    console.error("Error setting password:", err);
    res.status(500).json({ message: "Error setting password" });
  }
};

export const changeUserPassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Current and new passwords are required" });
  }

  if (newPassword.length < 4) {
    return res
      .status(400)
      .json({ error: "New password must be at least 4 characters long" });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.password || user.password.length === 0) {
      return res
        .status(400)
        .json({
          error: "No existing password set. Please set a password first.",
        });
    }

    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error changing password" });
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
  const rootDirs = await Directory.find({userId: {$in: userIds}, parentDirId: null}).lean();

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

  const transformedUsers = allUsers.map(({ _id, name, email, role, isDeleted, maxStorageLimit }) => ({
    id: _id,
    name,
    email,
    role,
    isLoggedIn: allSessionsUserIdSet.has(_id.toString()),
    isDeleted: isDeleted || false,

    usedStorageInBytes: storageMap[_id.toString()] || 0,
    maxStorageLimit: maxStorageLimit || 0
  }));

  res.status(200).json(transformedUsers);
};

export const softDeleteUser = async (req, res, next) => {
  const { userId } = req.params;
  if (req.user._id.toString() === userId) {
    return res.status(403).json({ error: "You cannot delete your self" });
  }
  const client = await mongoose.startSession();
  try {
    client.startTransaction();
    await User.findByIdAndUpdate({ _id: userId }, { isDeleted: true });
    await Session.deleteOne({ userId });
    client.commitTransaction();
    res.status(204).end();
  } catch (err) {
    client.abortTransaction();
    next(err);
  }
};

export const hardDeleteUser = async (req, res, next) => {
  const { userId } = req.params;
  if (req.user._id.toString() === userId) {
    return res.status(403).json({ error: "You cannot delete your self" });
  }

  if (req.user.role !== "Owner" && req.user.role !== "Admin") {
    return res
      .status(403)
      .json({ error: "You don't have permission to hard delete users" });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

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

    await session.commitTransaction();
    session.endSession();

    res.status(204).end({ message: "User and its data deleted successfully" });
  } catch (err) {
    session.endSession();
    next(err);
  }
};

export const recoverUser = async (req, res, next) => {
  const { userId } = req.params;
  if (req.user._id.toString() === userId) {
    return res.status(403).json({ error: "You cannot delete your self" });
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await User.findByIdAndUpdate(
      { _id: userId },
      { isDeleted: false },
      { session }
    );
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: `User has been recovered with UID: ${userId}`,
    });
  } catch (err) {
    session.endSession();
    next(err);
  }
};

export const permissionPage = async (req, res, next) => {
  const loggedInUser = req.user;

  if (loggedInUser.role === "User") {
    return res
      .status(403)
      .json({ error: "Access denied: inSufficient permission" });
  }

  const editableRoles = getEditableRoles(loggedInUser.role);
  try {
    const users = await User.find({
      _id: { $ne: loggedInUser._id },
      role: { $in: editableRoles },
    }).select("name email role");

    res.status(200).json({
      success: true,
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
    return res.status(403).json({ error: "Cannot change you're own role!" });
  }

  try {
    const targetedUser = await User.findById(userId);

    if (!targetedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const editableRoles = getEditableRoles(currentUserRole);

    if (!editableRoles.includes(role)) {
      return res.status(403).json({
        error: `You can only assign these roles: ${editableRoles.join(", ")}`,
      });
    }

    targetedUser.role = role;
    await targetedUser.save();

    res.json({
      message: "Role updated successfully",
      user: {
        id: targetedUser._id,
        name: targetedUser.name,
        email: targetedUser.email,
        role: targetedUser.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getUserFiles = async (req, res, next) => {
  const { userId } = req.params;
  const loggedInUser = req.user;

  if (!["Owner", "Admin"].includes(loggedInUser.role)) {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const files = await File.find({ userId }).lean();

    res.status(200).json(files);
  } catch (err) {
    next(err);
  }
};

export const deleteUserFiles = async (req, res, next) => {
  const { userId, fileId } = req.params;
  const loggedInUser = req.user;

  if (loggedInUser.role !== "Owner") {
    return res.status(403).json({ error: "Only Owner can delete files" });
  }

  try {
    const file = await File.findOneAndDelete({ _id: fileId, userId });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    console.log("File deleted:", file);

    res.status(200).json({ message: "File deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const getUserFileView = async (req, res, next) => {
  const { userId, fileId } = req.params;
  const loggedInUser = req.user;

  if (!["Owner", "Admin"].includes(loggedInUser.role)) {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const fileData = await File.findOne({
      _id: fileId,
      userId: userId,
    }).lean();

    if (!fileData) {
      return res.status(404).json({ error: "File not found" });
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
      return res.json({ url: getUrl });
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
    return res.status(400).json({ error: "File name is required" });
  }

  try {
    const file = await File.findOne({
      _id: fileId,
      userId: userId,
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    file.name = name.trim();
    await file.save();

    return res.status(200).json({
      message: "File renamed successfully",
    });
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

    res.json(usersList);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};


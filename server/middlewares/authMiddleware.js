import redisClient from "../config/redis.js";
import Subscription from "../models/subscriptionModel.js";
import User from "../models/userModel.js";

export default async function checkAuth(req, res, next) {
  const { sid } = req.signedCookies;

  if (!sid) {
    res.clearCookie("sid");
    return res.status(401).json({ error: "1 Not logged in!" });
  }

  const sessionRaw = await redisClient.get(`session:${sid}`);
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;

  if (!session) {
    res.clearCookie("sid");
    return res.status(401).json({ error: "2 Not logged in!" });
  }
  const user = await User.findById(session.userId);
  if (!user) {
    res.clearCookie("sid");
    return res.status(401).json({ error: "User not found!" });
  }

  // Fetch Subscription Status

  let subscriptionStatus = "free"; //default

  if (user.subscriptionId) {
    const sub = await Subscription.findOne({
      razorpaySubscriptionId: user.subscriptionId,
    });
    if (sub) {
      subscriptionStatus = sub.status;
    }
  }

  req.user = {
    _id: user._id,
    role: user.role,
    isDeleted: user.isDeleted,
    rootDirId: user.rootDirId,
    password: user.password,
    subscriptionStatus: subscriptionStatus,
  };

  next();
}

export const checkNotRegularUser = (req, res, next) => {
  if (req.user.role !== "User") return next();
  res.status(403).json({ error: "Users are restricted to access this page" });
};

export const checkIsOwnerOrAdmin = (req, res, next) => {
  if (req.user.role === "Owner" || req.user.role === "Admin") {
    return next();
  }
  res.status(403).json({ error: "You Cannot Delete User" });
};

export const checkUserDeleted = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  if (req.user.isDeleted) {
    return res.status(403).json({
      error: "Your account has been deleted. Contact Apps admin to recovery",
    });
  }
  next();
};

export const checkIsOwner = (req, res, next) => {
  if (req.user && req.user.role === "Owner") return next();
  return res.status(403).json({ error: "Access denied. Owner role required." });
};


/**
 * Blocks uploads/modifications for: paused, halted, expired
 */
export const checkUploadAccess = (req, res, next) => {
  const status = req.user.subscriptionStatus;
  if (["paused", "halted", "expired"].includes(status?.toLowerCase())) {
    return res.status(403).json({
      error: `Action restricted. Your subscription is ${status}.`,
    });
  }
  next();
};

/**
 * Blocks downloads/reads for: halted, expired (Allows 'paused')
 */
export const checkDownloadAccess = (req, res, next) => {
  const status = req.user.subscriptionStatus;
  if (["halted", "expired"].includes(status?.toLowerCase())) {
    return res.status(403).json({
      error: `Access denied. Your subscription is ${status}.`,
    });
  }
  next();
};
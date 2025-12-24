import Subscription from "../../models/subscriptionModel.js";
import User from "../../models/userModel.js";
import File from "../../models/fileModel.js";
import { getRootDirectorySize } from "../../utils/rootDirectorySize.js";
import redisClient from "../../config/redis.js";

export const PLAN_INFO = {
  plan_RuC1EiZlwurf5N: { name: "Standard Plan", tagline: "For Students & Freelancers", billingPeriod: "Monthly", price: 349, storage: "100 GB" },
  plan_RuC2evjqwSxHOH: { name: "Premium Plan", tagline: "For Professionals & Creators", billingPeriod: "Monthly", price: 999, storage: "200 GB" },
  plan_RuC3yiXd7cecny: { name: "Standard Plan", tagline: "For Students & Freelancers", billingPeriod: "Yearly", price: 3999, storage: "200 GB" },
  plan_RuC5FeIwTTfUSh: { name: "Premium Plan", tagline: "For Professionals & Creators", billingPeriod: "Yearly", price: 7999, storage: "300 GB" },
};

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getSubscriptionDetailsService = async (userId) => {
  const subscriptions = await Subscription.find({
    userId,
    status: { $in: ["active", "created", "pending", "past_due"] },
  }).sort({ createdAt: -1 });

  if (subscriptions.length === 0) {
    return null;
  }

  // Prioritize active plan for details view (e.g. during migration)
  const subscription = subscriptions.find(s => s.status === "active") || subscriptions[0];

  const user = await User.findById(userId);
  if (!user) {
    console.warn("User not found in getSubscriptionDetailsService for ID:", userId);
    return null;
  }
  const planInfo = PLAN_INFO[subscription.planId] || {
    name: "Pro Plan",
    tagline: "For Students & Freelancers",
    billingPeriod: "Monthly",
    price: 299
  };

  const usedInBytes = await getRootDirectorySize(userId);
  const totalInBytes = user.maxStorageLimit;
  const percentageUsed = ((usedInBytes / totalInBytes) * 100).toFixed(1);

  const totalFiles = await File.countDocuments({ userId });
  const sharedFiles = await File.countDocuments({ userId, "sharedWith.0": { $exists: true } });

  // Dynamic session counting
  let devicesConnected = 0;
  try {
    const keys = await redisClient.keys("session:*");
    if (keys.length > 0) {
      const sessions = await Promise.all(
        keys.map((key) => redisClient.json.get(key))
      );
      devicesConnected = sessions.filter(
        (s) => s && s.userId && s.userId.toString() === userId.toString()
      ).length;
    }
  } catch (err) {
    console.error("Error counting sessions for subscription stats:", err);
    devicesConnected = 1; // Fallback
  }

  const nextBillingDate = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "N/A";

  const daysLeft = subscription.currentPeriodEnd
    ? Math.ceil((new Date(subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    activePlan: {
      name: planInfo.name,
      tagline: planInfo.tagline,
      nextBillingDate,
      daysLeft,
      billingAmount: planInfo.price,
      billingPeriod: planInfo.billingPeriod,
      status: subscription.status,
      planId: subscription.planId,
      cancelledAt: subscription.cancelledAt,
    },
    storage: {
      usedInBytes,
      totalInBytes,
      percentageUsed,
      usedLabel: formatBytes(usedInBytes),
      totalLabel: formatBytes(totalInBytes),
    },
    limits: {
      maxFileSize: formatBytes(user.maxFileSize),
      prioritySpeed: user.maxStorageLimit > 524288000 ? "Active" : "Standard",
    },
    stats: {
      totalFiles,
      sharedFiles,
      devicesConnected: devicesConnected || 1, // At least 1 if they are seeing this
      maxDevices: user.maxDevices,
      uploadsDuringSubscription: totalFiles,
    },
    bonusDays: subscription.bonusDays || 0,
    isInTrial: subscription.status === "authenticated",
    trialEndsAt: subscription.authenticatedPeriodEnd ? subscription.authenticatedPeriodEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }) : null
  };
};

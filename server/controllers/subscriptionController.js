import Razorpay from "razorpay";
import Subscription from "../models/subscriptionModel.js";
import User from "../models/userModel.js";
import File from "../models/fileModel.js";
import { getRootDirectorySize } from "../utils/rootDirectorySize.js";

const rzpInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLAN_INFO = {
  plan_RuC1EiZlwurf5N: { name: "Standard Plan", tagline: "For Students & Freelancers", billingPeriod: "Monthly" },
  plan_RuC2evjqwSxHOH: { name: "Premium Plan", tagline: "For Professionals & Creators", billingPeriod: "Monthly" },
  plan_RuC3yiXd7cecny: { name: "Standard Plan", tagline: "For Students & Freelancers", billingPeriod: "Yearly" },
  plan_RuC5FeIwTTfUSh: { name: "Premium Plan", tagline: "For Professionals & Creators", billingPeriod: "Yearly" },
};

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const createSubscription = async (req, res, next) => {
// ... existing createSubscription logic ...
  // Check if user already has an active subscription
  const activeSubscription = await Subscription.findOne({
    userId: req.user._id,
    status: "active",
  });

  if (activeSubscription) {
    return res.json({
      message: "You already have an active subscription",
    });
  }

  // Check if user has a pending subscription for the SAME plan
  const pendingSubscription = await Subscription.findOne({
    userId: req.user._id,
    planId: req.body.planId,
    status: "created",
  });

  if (pendingSubscription) {
    return res.json({
      subscriptionId: pendingSubscription.razorpaySubscriptionId,
    });
  }

  try {
    const isYearly = ["plan_RuC3yiXd7cecny", "plan_RuC5FeIwTTfUSh"].includes(
      req.body.planId
    );

    const newSubscription = await rzpInstance.subscriptions.create({
      plan_id: req.body.planId,
      total_count: isYearly ? 10 : 60, // 10 years for yearly, 5 years for monthly
      notes: {
        user: req.user._id.toString(),
      },
    });

    const subscription = new Subscription({
      razorpaySubscriptionId: newSubscription.id,
      planId: req.body.planId,
      userId: req.user._id,
    });
    await subscription.save();
    return res.json({ subscriptionId: newSubscription.id });
  } catch (error) {
    console.log("Error creating subscription:", error);
    next(error);
  }
};

export const getSubscriptionDetails = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: "active",
    });

    if (!subscription) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    const user = await User.findById(req.user._id);
    const planInfo = PLAN_INFO[subscription.planId] || { name: "Pro Plan", tagline: "For Students & Freelancers", billingPeriod: "Monthly" };

    const usedInBytes = await getRootDirectorySize(req.user._id);
    const totalInBytes = user.maxStorageLimit;
    const percentageUsed = ((usedInBytes / totalInBytes) * 100).toFixed(1);

    const totalFiles = await File.countDocuments({ userId: req.user._id });
    const sharedFiles = await File.countDocuments({ userId: req.user._id, "sharedWith.0": { $exists: true } });

    // Mocking some values that might need more complex logic
    const nextBillingDate = subscription.currentPeriodEnd 
      ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "N/A";
    
    const daysLeft = subscription.currentPeriodEnd 
      ? Math.ceil((new Date(subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24))
      : 0;

    return res.json({
      activePlan: {
        name: planInfo.name,
        tagline: planInfo.tagline,
        nextBillingDate,
        daysLeft,
        billingAmount: user.maxStorageLimit > 524288000 ? 299 : 0, 
        billingPeriod: planInfo.billingPeriod,
        status: subscription.status,
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
        devicesConnected: 1, 
        maxDevices: user.maxDevices,
        uploadsDuringSubscription: totalFiles, 
      },
    });
  } catch (error) {
    console.log("Error getting subscription details:", error);
    next(error);
  }
};
import Razorpay from "razorpay";
import Subscription from "../models/subscriptionModel.js";

const rzpInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createSubscription = async (req, res, next) => {
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

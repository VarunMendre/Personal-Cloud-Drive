import Subscription from "../models/subscriptionModel.js";
import { rzpInstance } from "../services/subscription/createSubscription.js";
import {
  createSubscriptionService,
  getSubscriptionDetailsService,
} from "../services/subscription/index.js";

export const createSubscription = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const result = await createSubscriptionService(req.user._id, planId);
    return res.json(result);
  } catch (error) {
    console.log("Error creating subscription:", error);
    next(error);
  }
};

export const getSubscriptionDetails = async (req, res, next) => {
  try {
    const details = await getSubscriptionDetailsService(req.user._id);

    if (!details) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    return res.json(details);
  } catch (error) {
    console.log("Error getting subscription details:", error);
    next(error);
  }
};

export const getSubscriptionInvoice = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: "active",
    });

    if (!subscription) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    // fetch invoices from razorpay for this subscription

    const invoice = await rzpInstance.invoices.all({
      subscription_id: subscription.razorpaySubscriptionId,
    });

    // find the most recent paid invoice 

    const lastInvoice = invoice.items.find(inv => inv.status === "paid");

    if (!lastInvoice || !lastInvoice.short_url) {
      return res.status(404).json({ message: "No paid invoice found" });
    }

    return res.json({ invoiceUrl: lastInvoice.short_url });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    next(error);
  }
};

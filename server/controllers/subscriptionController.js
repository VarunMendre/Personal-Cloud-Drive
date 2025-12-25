import Webhook from "../models/rzpwebhookModel.js";
import Subscription from "../models/subscriptionModel.js";
import { rzpInstance } from "../services/subscription/createSubscription.js";
import {
  cancelSubscriptionService,
  changePlanService,
  createSubscriptionService,
  getEligiblePlanService,
  getSubscriptionDetailsService,
  pauseSubscriptionService,
  resumeSubscriptionService,
} from "../services/subscription/index.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const createSubscription = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const result = await createSubscriptionService(req.user._id, planId);
    return successResponse(res, result);
  } catch (error) {
    console.log("Error creating subscription:", error);
    return errorResponse(res, error.message, error.status || 500);
  }
};

export const getSubscriptionDetails = async (req, res, next) => {
  try {
    const details = await getSubscriptionDetailsService(req.user._id);

    if (!details) {
      return errorResponse(res, "No active subscription found", 404);
    }

    return successResponse(res, details);
  } catch (error) {
    console.log("Error getting subscription details:", error);
    next(error);
  }
};

export const getSubscriptionInvoice = async (req, res, next) => {
  try {

    // get the most recent active subscription
    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: "active",
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return errorResponse(res, "No active subscription found", 404);
    }

    // fetch invoices from razorpay for this subscription

    const invoice = await rzpInstance.invoices.all({
      subscription_id: subscription.razorpaySubscriptionId,
    });

    // find the most recent paid invoice

    const lastInvoice = invoice.items.find((inv) => inv.status === "paid");

    if (!lastInvoice || !lastInvoice.short_url) {
      return errorResponse(res, "No paid invoice found", 404);
    }

    return successResponse(res, { invoiceUrl: lastInvoice.short_url });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    next(error);
  }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const result = await cancelSubscriptionService(req.user._id, planId);

    if (result && result.success === false) {
      return errorResponse(res, result.message || "Failed to cancel subscription", 400);
    }

    return successResponse(res, result);
  } catch (error) {
    console.error("Error while canceling subscription", error);
    next(error);
  }
};

export const pauseSubscription = async (req, res, next) => {
  try {
    const { id } = req.params; // razorpaySubscriptionId
    const result = await pauseSubscriptionService(id);
    return successResponse(res, result);
  } catch (error) {
    console.error("Error pausing subscription:", error);
    next(error);
  }
};

export const resumeSubscription = async (req, res, next) => {
  try {
    const { id } = req.params; // razorpaySubscriptionId
    const result = await resumeSubscriptionService(id);
    return successResponse(res, result);
  } catch (error) {
    console.error("Error resuming subscription:", error);
    next(error);
  }
};

export const checkSubscriptionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // check subscription status from razorpay

    const activationevent = await Webhook.findOne({
      razorpaySubscriptionId: id,
      eventType: "subscription.activated",
      status: "processed",
    });

    if (activationevent) {
      return successResponse(res, {
        status: "active",
      });
    }

    return successResponse(res, { active: false });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    next(error);
  }
};

export const renewalSubscription = async (req, res, next) => {
  try {
    const result = await getEligiblePlanService(req.user._id);
    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const changePlan = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const result = await changePlanService(req.user._id, planId);
    return successResponse(res, result);
  } catch (error) {
    console.error("Error changing plan:", error);
    next(error);
  }
}
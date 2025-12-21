import { 
  createSubscriptionService, 
  getSubscriptionDetailsService 
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
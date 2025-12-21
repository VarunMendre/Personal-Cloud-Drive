import Razorpay from "razorpay";
import Subscription from "../models/subscriptionModel.js";

const rzpInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


export const createSubscription = async (req, res,next ) => {

    try {
        const isYearly = ["plan_RuC3yiXd7cecny", "plan_RuC5FeIwTTfUSh"].includes(req.body.planId);
        
        const newSubscription = await rzpInstance.subscriptions.create({
          plan_id: req.body.planId,
          total_count: isYearly ? 10 : 60, // 10 years for yearly, 5 years for monthly
          notes: {
              user: req.user._id
          }
        });

        const subscription = new Subscription({
            razorpaySubscriptionId: newSubscription.id,
            userId: req.user._id,
        });

        await subscription.save();
        return res.json({subscriptionId: newSubscription.id});
    } catch (error) {
        console.log("Error creating subscription:", error);
        next(error)
    }
}
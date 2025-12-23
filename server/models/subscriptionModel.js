import { model, Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    razorpaySubscriptionId: {
      type: String,
      required: true,
      unique: true,
    },
    planId: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    status: {
      type: String,
      enum: [
        "created",
        "active",
        "cancelled",
        "past_due",
        "paused",
        "completed",
        "pending",
        "renewal_failed",
        "expired",
        "halted"
      ],
      default: "created",
    },
    retryCount: {
      type: Number,
      default:0,
    },
    lastPaymentAttempt: {
      type: Date,
    },
    gracePeriodEndsAt: {
      type: Date,
    },
    currentPeriodStart: {
      type: Date,
      default: null,
    },
    currentPeriodEnd: {
      type: Date, 
      default: null,
    },
    startDate: {
      type: Date,
      default:null
    },
    endDate: {
      type: Date,
      default: null,
    },
    invoiceId: {
      type: String,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  {
    strict: "throw",
    timestamps: true,
  }
);

const Subscription = model("Subscription", subscriptionSchema);
export default Subscription;

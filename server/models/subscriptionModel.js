import { model, Schema } from "mongoose";
import { type } from "node:os";

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
        "halted",
        "authenticated"
      ],
      default: "created",
    },
    retryCount: {
      type: Number,
      default: 0,
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
      default: null,
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
      default: null,
    },
    bonusDays: {
      type: Number,
      default: 0,
      min: 0,
      max: 15,
    },
    authenticatedPeriodStart: {
      type: Date,
      default: null,
    },
    authenticatedPeriodEnd: {
      type: Date,
      default: null,
    },
  },
  {
    strict: "throw",
    timestamps: true,
  }
);

const Subscription = model("Subscription", subscriptionSchema);
export default Subscription;

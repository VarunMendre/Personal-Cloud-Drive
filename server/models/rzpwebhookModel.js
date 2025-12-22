import { Schema, model } from "mongoose";

const RazorpayWebhookSchema = new Schema(
    {
        eventType: {
            type: String,
            required: true,
        },
        signature: {
            type: String,
            required: true,
            unique: true,
        },
        payload: {
            type: Schema.Types.Mixed,
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        razorpaySubscriptionId: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ["pending", "processed", "failed"],
            default: "pending",
        },
        responseMessage: {
            type: String,
            default: "",
        },
        receivedAt: {
            type: Date,
            default: Date.now,
            index: { expires: "1d" }, // Auto-delete after 1 day
        },
        processedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Webhook = model("Webhook", RazorpayWebhookSchema);

export default Webhook;
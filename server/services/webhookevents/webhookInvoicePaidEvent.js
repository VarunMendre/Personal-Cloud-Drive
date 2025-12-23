import Subscription from "../../models/subscriptionModel.js";

export const handleInvoicePaidEvent = async (webhookBody) => {
    try {
        // get the invoice
        const invoice = webhookBody.payload.invoice.entity;

        // extract the Id's we need

        const invoiceId = invoice.id;
        const subscriptionId = invoice.subscription_id;

        // update subscription model

        await Subscription.findOneAndUpdate(
            { razorpaySubscriptionId: subscriptionId },
            { 
                invoiceId: invoiceId,
                status: "active",
                retryCount: 0,
                gracePeriodEndsAt: null
            }
        );

        
        console.log(`Invoice ${invoiceId} paid successfully`);
    } catch (error) {
        console.error(`Error processing invoice paid event: ${error.message}`);
    }
}

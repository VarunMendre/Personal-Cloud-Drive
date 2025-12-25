import { handleActivationEvent } from "./webhookActivationEvent.js";
import { handleInvoicePaidEvent } from "./webhookInvoicePaidEvent.js";
import { handlePauseEvent } from "./webhookPauseEvent.js";
import { handleResumeEvent } from "./webhookResumeEvent.js";
import { handleCancelledEvent } from "./webhookCancelledEvent.js";
import { webhookPaymentFailedEvent } from "./webhookPaymentFailedEvent.js";
import { webhookHaltedEvent } from "./webhookHaltedEvent.js";
import { sendSubscriptionActiveEmail } from "../emailService/subscriptionActive.js";

export async function WebhookEventHandler(event, webhookBody) {
  switch (event) {
    case "subscription.activated":
      await handleActivationEvent(webhookBody);
      break;

    case "subscription.cancelled":
      await handleCancelledEvent(webhookBody);
      break;

    case "subscription.paused":
      await handlePauseEvent(webhookBody);
      break;

    case "subscription.resumed":
      await handleResumeEvent(webhookBody);
      break;

    case "invoice.paid":
    case "subscription.charged":
      await handleInvoicePaidEvent(webhookBody);
      break;

    case "subscription.authenticated":
      console.log(`[Webhook] Subscription authenticated: ${webhookBody.payload.subscription.entity.id}`);
      break;

    case "invoice.payment_failed":
    case "subscription.pending":
      await webhookPaymentFailedEvent(webhookBody);
      break;

    case "subscription.halted":
      await webhookHaltedEvent(webhookBody);
      break;

    default:
      console.log(`Unhandled webhook event: ${event}`);
      break;
  }
}

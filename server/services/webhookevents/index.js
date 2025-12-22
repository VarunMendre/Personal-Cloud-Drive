import { handleActivationEvent } from "./webhookActivationEvent.js";
import { handleCancelledEvent } from "./webhookCancelledEvent.js";
import { handlePauseEvent } from "./webhookPauseEvent.js";
import { handleResumeEvent } from "./webhookResumeEvent.js";
import { handleInvoicePaidEvent } from "./webhookInvoicePaidEvent.js";

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
      await handleInvoicePaidEvent(webhookBody);
      break;

    default:
      console.log(`Unhandled webhook event: ${event}`);
      break;
  }
}

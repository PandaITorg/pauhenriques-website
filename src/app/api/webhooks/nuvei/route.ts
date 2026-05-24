import { createWebhookHandler } from "@pandait.tech/payment-nuvei/handlers";
import {
  firebase,
  email,
  onPaymentSucceeded,
  handleCustomDevReference,
} from "@/lib/nuvei-deps";

export const POST = createWebhookHandler({
  firebase,
  email,
  onPaymentSucceeded,
  handleCustomDevReference,
  // Authenticates the webhook: POSTs without ?key=<NUVEI_WEBHOOK_SECRET> (or the
  // x-webhook-key header) are rejected with 401. Closes the endpoint as a
  // forgeable attack surface (Nuvei does not call it for Pau today).
  webhookSecret: process.env.NUVEI_WEBHOOK_SECRET,
});

export const dynamic = "force-dynamic";

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
});

export const dynamic = "force-dynamic";

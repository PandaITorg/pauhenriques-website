import { createChargeHandler } from "@pandait.tech/payment-nuvei/handlers";
import {
  firebase,
  email,
  rateLimit,
  turnstile,
  getPriceDisplay,
  validateCustomOrder,
  onPaymentSucceeded,
  getRetryUrl,
  merchantName,
  cloudFunctionsBaseUrl,
} from "@/lib/nuvei-deps";

export const POST = createChargeHandler({
  firebase,
  email,
  rateLimit,
  turnstile,
  getPriceDisplay,
  merchantName,
  cloudFunctionsBaseUrl,
  validateCustomOrder,
  onPaymentSucceeded,
  getRetryUrl,
});

export const dynamic = "force-dynamic";

import { create3dsCompleteHandler } from "@pandait.tech/payment-nuvei/handlers";
import {
  firebase,
  email,
  onPaymentSucceeded,
  getRetryUrl,
} from "@/lib/nuvei-deps";

export const POST = create3dsCompleteHandler({
  firebase,
  email,
  onPaymentSucceeded,
  getRetryUrl,
});

export const dynamic = "force-dynamic";

import { create3dsTimeoutHandler } from "@pandait.tech/payment-nuvei/handlers";
import { firebase, email, getRetryUrl } from "@/lib/nuvei-deps";

export const POST = create3dsTimeoutHandler({
  firebase,
  email: { sendPaymentFailed: email.sendPaymentFailed },
  getRetryUrl,
});

export const dynamic = "force-dynamic";

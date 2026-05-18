import { createRefundHandler } from "@pandait.tech/payment-nuvei/handlers";
import { firebase } from "@/lib/nuvei-deps";

export const POST = createRefundHandler({
  firebase,
});

export const dynamic = "force-dynamic";

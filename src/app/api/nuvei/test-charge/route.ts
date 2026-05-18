import { createTestChargeHandler } from "@pandait.tech/payment-nuvei/handlers";
import { firebase } from "@/lib/nuvei-deps";

export const POST = createTestChargeHandler({
  firebase: { auth: firebase.auth },
});

export const dynamic = "force-dynamic";

import { create3dsCallbackHandler } from "@pandait.tech/payment-nuvei/handlers";
import { firebase } from "@/lib/nuvei-deps";

export const { POST, GET } = create3dsCallbackHandler({
  firebase: { db: firebase.db },
});

export const dynamic = "force-dynamic";

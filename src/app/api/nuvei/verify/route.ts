import { createVerifyHandler } from "@pandait.tech/payment-nuvei/handlers";
import { firebase } from "@/lib/nuvei-deps";

export const POST = createVerifyHandler({
  firebase,
});

export const dynamic = "force-dynamic";

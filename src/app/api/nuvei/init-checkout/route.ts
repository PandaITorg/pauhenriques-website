import { createInitCheckoutHandler } from "@pandait.tech/payment-nuvei/handlers";
import {
  firebase,
  merchantDescription,
  themeColors,
} from "@/lib/nuvei-deps";

export const POST = createInitCheckoutHandler({
  firebase: { auth: firebase.auth },
  defaultDescription: merchantDescription,
  themeColors,
});

export const dynamic = "force-dynamic";

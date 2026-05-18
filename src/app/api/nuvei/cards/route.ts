import { createCardsHandler } from "@pandait.tech/payment-nuvei/handlers";
import { firebase } from "@/lib/nuvei-deps";

export const { GET, DELETE } = createCardsHandler({
  firebase,
});

export const dynamic = "force-dynamic";

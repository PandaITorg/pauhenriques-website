import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// Paymentez ACS POSTs to this endpoint after the 3DS challenge completes.
// We capture the cres (Challenge Response) value and store it on the order,
// then redirect to 3ds-return so the checkout page can proceed with verify.
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId") || "";

  let transStatus = "U";
  let cres = "";

  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      transStatus = params.get("transStatus") || "U";
      cres = params.get("cres") || params.get("CRes") || "";
    } else {
      const body = await request.json();
      transStatus = body.transStatus || "U";
      cres = body.cres || body.CRes || "";
    }
  } catch {
    // If we can't read body, default to U (unknown)
  }

  // Store cres on the order so 3ds-complete can use it for BY_CRES verify
  if (orderId && cres && dbAdmin) {
    try {
      await dbAdmin.collection("orders").doc(orderId).update({
        threeDSCres: cres,
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error("Failed to store cres on order:", err);
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  return NextResponse.redirect(
    `${baseUrl}/checkout/3ds-return?orderId=${encodeURIComponent(orderId)}&transStatus=${encodeURIComponent(transStatus)}`,
    303,
  );
}

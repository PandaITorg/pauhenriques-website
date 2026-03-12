import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Paymentez POSTs to this endpoint after the 3DS challenge completes.
// We redirect the iframe to the 3ds-return page (GET) which postMessages the parent checkout.
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId") || "";

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  return NextResponse.redirect(
    `${baseUrl}/checkout/3ds-return?orderId=${encodeURIComponent(orderId)}`,
    303, // 303 See Other — ensures browser does a GET on redirect
  );
}

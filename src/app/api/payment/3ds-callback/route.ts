import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Paymentez POSTs to this endpoint after the 3DS challenge completes.
// We forward transStatus to the 3ds-return page so checkout can reject failed authentications.
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId") || "";

  // Read transStatus from Paymentez POST body (form-encoded or JSON)
  let transStatus = "Y";
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      transStatus = params.get("transStatus") || "Y";
    } else {
      const body = await request.json();
      transStatus = body.transStatus || "Y";
    }
  } catch {
    // If we can't read body, default to Y and let Paymentez server-side validate
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  return NextResponse.redirect(
    `${baseUrl}/checkout/3ds-return?orderId=${encodeURIComponent(orderId)}&transStatus=${encodeURIComponent(transStatus)}`,
    303,
  );
}

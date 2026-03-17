import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// Paymentez ACS calls this endpoint after the 3DS challenge completes (POST or GET).
// We capture the cres (Challenge Response) value and store it on the order,
// then redirect to /payment/3ds-return (outside /checkout/* to avoid auth blocking).

function buildReturnUrl(request: NextRequest, orderId: string, transStatus: string) {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
  return `${baseUrl}/payment/3ds-return?orderId=${encodeURIComponent(orderId)}&transStatus=${encodeURIComponent(transStatus)}`;
}

async function storeCres(orderId: string, cres: string) {
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
}

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

  await storeCres(orderId, cres);
  return NextResponse.redirect(buildReturnUrl(request, orderId, transStatus), 303);
}

// Some ACS implementations use GET redirect instead of POST
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId") || "";
  const transStatus = searchParams.get("transStatus") || "Y";
  const cres = searchParams.get("cres") || searchParams.get("CRes") || "";

  await storeCres(orderId, cres);
  return NextResponse.redirect(buildReturnUrl(request, orderId, transStatus), 303);
}

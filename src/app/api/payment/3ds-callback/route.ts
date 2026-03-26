import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// Paymentez ACS calls this endpoint after the 3DS challenge completes.
// We capture the cres value, store it, and return an HTML page that
// sends a postMessage to the parent checkout window — no redirects needed.
// (Firebase App Hosting blocks 303 redirects from API routes.)

function buildCompletionPage(orderId: string, transStatus: string): NextResponse {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>3DS Verification</title></head>
<body>
<script>
(function() {
  var message = {
    type: "3DS_COMPLETE",
    orderId: "${orderId}",
    transStatus: "${transStatus}"
  };
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, "*");
    } else if (window.opener) {
      window.opener.postMessage(message, "*");
    }
  } catch(e) {}
})();
</script>
<p style="font-family:sans-serif;color:#666;text-align:center;margin-top:40px">
Verificando autenticaci&oacute;n...
</p>
</body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
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
  return buildCompletionPage(orderId, transStatus);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId") || "";
  const transStatus = searchParams.get("transStatus") || "Y";
  const cres = searchParams.get("cres") || searchParams.get("CRes") || "";

  await storeCres(orderId, cres);
  return buildCompletionPage(orderId, transStatus);
}

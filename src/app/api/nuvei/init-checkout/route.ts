import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase-admin";
import { nuveiRequest } from "@/lib/nuvei";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * Initialize a Nuvei checkout reference for the PaymentCheckout modal.
 * POST /api/nuvei/init-checkout
 */
export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie || !auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let decodedToken;
  try {
    decodedToken = await auth.verifySessionCookie(sessionCookie, true);
  } catch {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }

  try {
    const { amount, vat, description, devReference } = await request.json();

    if (!amount || !devReference) {
      return NextResponse.json(
        { error: "amount y devReference son requeridos" },
        { status: 400 },
      );
    }

    const sessionId = crypto.randomBytes(16).toString("hex");

    const result = await nuveiRequest<{
      reference?: string;
      checkout_url?: string;
      error?: {
        type: string;
        help: string;
        description: string;
      };
    }>("/v2/transaction/init_reference/", "POST", {
      locale: "es",
      session_id: sessionId,
      order: {
        amount,
        description: description || "Pago Pau Henriques",
        vat: vat ?? 0,
        dev_reference: devReference,
        installments_type: 0,
      },
      user: {
        id: decodedToken.uid,
        email: decodedToken.email || "",
      },
      conf: {
        theme: {
          primary_color: "#a68a63",
          secondary_color: "#1a1a1a",
        },
      },
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.description || "Error al inicializar checkout" },
        { status: 400 },
      );
    }

    if (!result.reference) {
      return NextResponse.json(
        { error: "No se recibió referencia de checkout" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      reference: result.reference,
      checkoutUrl: result.checkout_url,
    });
  } catch (error) {
    console.error("Init checkout error:", error);
    return NextResponse.json(
      { error: "Error al inicializar checkout" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth, dbAdmin } from "@/lib/firebase-admin";
import { verifyCard } from "@/lib/nuvei";

export const dynamic = "force-dynamic";

/**
 * Verify a Diners card after tokenization.
 * Required by Nuvei for Diners/Pichincha cards.
 * The user receives a micro-charge and must enter the value to verify.
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
    const { cardToken, transactionReference, value } = await request.json();

    if ((!cardToken && !transactionReference) || !value) {
      return NextResponse.json(
        { error: "transactionReference y value son requeridos" },
        { status: 400 },
      );
    }

    const result = await verifyCard({
      userId: decodedToken.uid,
      userEmail: decodedToken.email || "",
      transactionReference: transactionReference || cardToken,
      value,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.description || "Error de verificación" },
        { status: 400 },
      );
    }

    // Persist verified status in Firestore so it survives page reloads
    if (dbAdmin && cardToken) {
      try {
        await dbAdmin
          .collection("users")
          .doc(decodedToken.uid)
          .collection("verifiedCards")
          .doc(cardToken)
          .set({ verifiedAt: new Date() });
      } catch (err) {
        console.error("Failed to persist verified card:", err);
      }
    }

    return NextResponse.json({
      success: true,
      transaction: result.transaction,
    });
  } catch (error) {
    console.error("Card verify error:", error);
    return NextResponse.json(
      { error: "Error al verificar tarjeta" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase-admin";
import { debitWithToken } from "@/lib/nuvei";

export const dynamic = "force-dynamic";

/**
 * Test-only endpoint: charges a tokenized card without Firestore order validation.
 * Only available in non-production environments.
 */
export async function POST(request: NextRequest) {
  if (process.env.NUVEI_ENV === "prod") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

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
    const { token, amount, vat, description, devReference } =
      await request.json();

    if (!token || !amount || !devReference) {
      return NextResponse.json(
        { error: "token, amount y devReference son requeridos" },
        { status: 400 },
      );
    }

    const result = await debitWithToken({
      userId: decodedToken.uid,
      userEmail: decodedToken.email || "",
      amount,
      description: description || "Test charge",
      devReference,
      cardToken: token,
      vat: vat ?? 0,
    });

    console.log("Test charge result:", JSON.stringify(result, null, 2));

    if (
      result.transaction &&
      result.transaction.status === "success" &&
      result.transaction.status_detail === 3
    ) {
      return NextResponse.json({
        success: true,
        transaction: result.transaction,
        card: result.card,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          result.transaction?.message ||
          result.error?.description ||
          "Pago rechazado",
        detail: result,
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Test charge error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

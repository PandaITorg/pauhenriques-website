import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, auth } from "@/lib/firebase-admin";
import { debitWithToken } from "@/lib/nuvei";

export const dynamic = "force-dynamic";

interface ThreeDSCompleteBody {
  orderId: string;
  userId: string;
  userEmail: string;
  token: string;
  amount: number;
  vat: number;
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify session
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie || !auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    } catch {
      return NextResponse.json({ error: "Sesion invalida" }, { status: 401 });
    }

    const body: ThreeDSCompleteBody = await request.json();
    const { orderId, userId, userEmail, token, amount, vat, description } = body;

    if (!orderId || !userId || !token || !amount) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    if (decodedToken.uid !== userId) {
      return NextResponse.json({ error: "Usuario no coincide" }, { status: 403 });
    }

    // Validate order is in 3ds-pending state (prevents double charge)
    if (dbAdmin) {
      const orderDoc = await dbAdmin.collection("orders").doc(orderId).get();
      if (!orderDoc.exists) {
        return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
      }
      const orderData = orderDoc.data();
      if (orderData?.status !== "3ds-pending") {
        return NextResponse.json(
          { error: "Esta orden ya fue procesada" },
          { status: 409 },
        );
      }
    }

    // Second debit call — no extra_params needed, 3DS already authenticated
    const nuveiData = await debitWithToken({
      userId,
      userEmail,
      amount,
      description,
      devReference: orderId,
      cardToken: token,
      vat: vat ?? 0,
    });

    if (
      nuveiData.transaction &&
      nuveiData.transaction.status === "success" &&
      nuveiData.transaction.status_detail === 3
    ) {
      if (dbAdmin) {
        await dbAdmin.collection("orders").doc(orderId).update({
          status: "paid",
          paymentTransactionId: nuveiData.transaction.id,
          authorizationCode: nuveiData.transaction.authorization_code || null,
          chargeResponseAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return NextResponse.json({
        success: true,
        transactionId: nuveiData.transaction.id,
        authorizationCode: nuveiData.transaction.authorization_code,
        orderId,
      });
    } else {
      if (dbAdmin) {
        await dbAdmin.collection("orders").doc(orderId).update({
          status: "failed",
          chargeResponseAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return NextResponse.json(
        { error: "No se pudo completar el pago tras la autenticación 3DS." },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("3DS complete error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, auth } from "@/lib/firebase-admin";
import { debitWithToken } from "@/lib/nuvei";

export const dynamic = "force-dynamic";

interface ChargeRequestBody {
  token: string;
  orderId: string;
  amount: number;
  description: string;
  userId: string;
  userEmail: string;
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

    const body: ChargeRequestBody = await request.json();
    const { token, orderId, amount, description, userId, userEmail } = body;

    if (!token || !orderId || !amount) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 },
      );
    }

    // Verify the user matches the session
    if (decodedToken.uid !== userId) {
      return NextResponse.json({ error: "Usuario no coincide" }, { status: 403 });
    }

    // Re-validate order exists in Firestore to prevent price tampering
    if (dbAdmin) {
      const orderDoc = await dbAdmin.collection("orders").doc(orderId).get();
      if (!orderDoc.exists) {
        return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
      }
    }

    // Call Nuvei debit with token
    const nuveiData = await debitWithToken({
      userId,
      userEmail,
      amount,
      description,
      devReference: orderId,
      cardToken: token,
    });

    if (
      nuveiData.transaction &&
      nuveiData.transaction.status === "success" &&
      nuveiData.transaction.status_detail === 3
    ) {
      // Update order in Firestore
      if (dbAdmin) {
        await dbAdmin.collection("orders").doc(orderId).update({
          status: "paid",
          paymentTransactionId: nuveiData.transaction.id,
          updatedAt: new Date(),
        });
      }

      return NextResponse.json({
        success: true,
        transactionId: nuveiData.transaction.id,
        orderId,
      });
    } else {
      // Update order status to failed
      if (dbAdmin) {
        await dbAdmin.collection("orders").doc(orderId).update({
          status: "cancelled",
          updatedAt: new Date(),
        });
      }

      return NextResponse.json(
        {
          error:
            nuveiData.transaction?.message ||
            nuveiData.error?.description ||
            "Pago rechazado",
          detail: nuveiData,
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Payment charge error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

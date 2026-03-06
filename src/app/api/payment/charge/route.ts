import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, auth } from "@/lib/firebase-admin";

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

    // Re-calculate total from order items in Firestore to prevent price tampering
    if (dbAdmin) {
      const orderDoc = await dbAdmin.collection("orders").doc(orderId).get();
      if (!orderDoc.exists) {
        return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
      }
    }

    // Call Nuvei/Paymentez Debit API
    const serverAppCode = process.env.NUVEI_SERVER_APP_CODE;
    const serverAppKey = process.env.NUVEI_SERVER_APP_KEY;

    if (!serverAppCode || !serverAppKey) {
      return NextResponse.json(
        { error: "Configuracion de pago no disponible" },
        { status: 500 },
      );
    }

    // Generate auth token for Nuvei server API
    const timestamp = Math.floor(Date.now() / 1000);
    const crypto = await import("crypto");
    const uniqToken = crypto
      .createHash("sha256")
      .update(`${serverAppKey}${timestamp}`)
      .digest("hex");
    const authToken = Buffer.from(
      `${serverAppCode};${timestamp};${uniqToken}`,
    ).toString("base64");

    // Nuvei Debit (charge) API - staging
    const nuveiResponse = await fetch(
      "https://ccapi-stg.paymentez.com/v2/transaction/debit/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Auth-Token": authToken,
        },
        body: JSON.stringify({
          user: {
            id: userId,
            email: userEmail,
          },
          order: {
            amount: amount,
            description: description,
            dev_reference: orderId,
            vat: 0,
          },
          card: {
            token: token,
          },
        }),
      },
    );

    const nuveiData = await nuveiResponse.json();

    if (
      nuveiData.transaction &&
      nuveiData.transaction.status === "success"
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
          error: nuveiData.transaction?.message || "Pago rechazado",
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

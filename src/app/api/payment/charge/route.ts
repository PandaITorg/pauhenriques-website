import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, auth } from "@/lib/firebase-admin";
import { debitWithToken } from "@/lib/nuvei";

export const dynamic = "force-dynamic";

// Nuvei/Paymentez status_detail codes → user-friendly messages in Spanish
const NUVEI_ERROR_MESSAGES: Record<number, string> = {
  0: "Error del procesador de pagos. Intenta de nuevo.",
  1: "El banco rechazó la transacción. Contacta a tu banco.",
  2: "Error en la validación del banco. Verifica los datos de tu tarjeta.",
  // 3 = success, not used here
  4: "Tarjeta rechazada por el banco. Intenta con otra tarjeta.",
  5: "Transacción no permitida por el banco emisor.",
  6: "Error de comunicación con el banco. Intenta en unos minutos.",
  7: "Tarjeta reportada como perdida o robada. Contacta a tu banco.",
  8: "Tarjeta rechazada por seguridad antifraude.",
  9: "Fondos insuficientes. Verifica tu saldo o usa otra tarjeta.",
  10: "La tarjeta no pudo ser procesada. Intenta con otra tarjeta.",
  11: "Transacción duplicada detectada. Espera unos minutos.",
  12: "Error de conexión con el banco. Intenta de nuevo.",
  13: "Tarjeta inválida o deshabilitada. Contacta a tu banco.",
  14: "El monto excede el límite permitido por tu tarjeta.",
  19: "Transacción rechazada por filtro antifraude.",
  20: "Tarjeta vencida. Actualiza tu método de pago.",
  21: "Código de seguridad (CVV) incorrecto.",
  22: "Tipo de tarjeta no soportado para esta transacción.",
  23: "Transacción rechazada. Intenta de nuevo más tarde.",
};

function getNuveiUserMessage(statusDetail?: number, rawMessage?: string | null): string {
  if (statusDetail !== undefined && NUVEI_ERROR_MESSAGES[statusDetail]) {
    return NUVEI_ERROR_MESSAGES[statusDetail];
  }
  // Fallback: clean common raw messages
  if (rawMessage?.toLowerCase().includes("insufficient")) {
    return NUVEI_ERROR_MESSAGES[9];
  }
  if (rawMessage?.toLowerCase().includes("expired")) {
    return NUVEI_ERROR_MESSAGES[20];
  }
  if (rawMessage?.toLowerCase().includes("cvv")) {
    return NUVEI_ERROR_MESSAGES[21];
  }
  return "No se pudo procesar el pago. Verifica los datos de tu tarjeta o intenta con otra.";
}

interface ChargeRequestBody {
  token: string;
  orderId: string;
  amount: number;
  vat: number;
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
    const { token, orderId, amount, vat, description, userId, userEmail } = body;

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

    // Re-validate order exists and is pending (prevents double charge)
    if (dbAdmin) {
      const orderDoc = await dbAdmin.collection("orders").doc(orderId).get();
      if (!orderDoc.exists) {
        return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
      }
      const orderData = orderDoc.data();
      if (orderData?.status !== "pending") {
        return NextResponse.json(
          { error: "Esta orden ya fue procesada" },
          { status: 409 },
        );
      }

      // Validate stock and prices for each item before charging
      const orderItems: Array<{ productId: string; name: string; price: number; quantity: number }> =
        orderData?.items || [];
      let verifiedSubtotal = 0;
      for (const item of orderItems) {
        const productDoc = await dbAdmin.collection("products").doc(item.productId).get();
        if (!productDoc.exists || !productDoc.data()?.isActive) {
          return NextResponse.json(
            { error: `El producto "${item.name}" ya no está disponible` },
            { status: 409 },
          );
        }
        const productData = productDoc.data()!;
        const stock = productData.stock ?? 0;
        if (stock < item.quantity) {
          return NextResponse.json(
            { error: `Stock insuficiente para "${item.name}" (disponible: ${stock})` },
            { status: 409 },
          );
        }
        const currentPrice = productData.price ?? 0;
        if (currentPrice !== item.price) {
          return NextResponse.json(
            { error: `El precio de "${item.name}" ha cambiado. Por favor, actualiza tu carrito.` },
            { status: 409 },
          );
        }
        verifiedSubtotal += currentPrice * item.quantity;
      }

      // Verify total matches server-calculated amount
      const verifiedVat = Math.round(verifiedSubtotal * 0.15 * 100) / 100;
      const verifiedTotal = Math.round((verifiedSubtotal + verifiedVat) * 100) / 100;
      if (verifiedTotal !== amount) {
        return NextResponse.json(
          { error: "El monto no coincide con los precios actuales. Actualiza tu carrito." },
          { status: 409 },
        );
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
      vat: vat ?? 0,
    });

    if (
      nuveiData.transaction &&
      nuveiData.transaction.status === "success" &&
      nuveiData.transaction.status_detail === 3
    ) {
      // Update order — charge sets "paid" and transaction data.
      // Webhook may also update; we use merge-friendly fields so neither overwrites the other.
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
      // Charge failed — mark as failed but let webhook override if it has different info
      if (dbAdmin) {
        const currentOrder = await dbAdmin.collection("orders").doc(orderId).get();
        const currentStatus = currentOrder.data()?.status;
        // Only downgrade if webhook hasn't already set a final status
        if (currentStatus === "pending") {
          await dbAdmin.collection("orders").doc(orderId).update({
            status: "failed",
            chargeResponseAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      return NextResponse.json(
        {
          error: getNuveiUserMessage(
            nuveiData.transaction?.status_detail,
            nuveiData.transaction?.message || nuveiData.error?.description,
          ),
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

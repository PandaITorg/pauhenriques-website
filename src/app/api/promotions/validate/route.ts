import { NextRequest, NextResponse } from "next/server";
import { auth, dbAdmin } from "@/lib/firebase-admin";
import { ValidateCouponSchema } from "@/lib/schemas/promotion.schema";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verify authenticated user
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

    if (!dbAdmin) {
      return NextResponse.json({ error: "DB not available" }, { status: 500 });
    }

    const body = await request.json();
    const parsed = ValidateCouponSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { valid: false, reason: "Datos invalidos" },
        { status: 400 },
      );
    }

    const { code, subtotal, items } = parsed.data;
    const userId = decodedToken.uid;

    // Find promotion by code
    const promoSnap = await dbAdmin
      .collection("promotions")
      .where("code", "==", code)
      .limit(1)
      .get();

    if (promoSnap.empty) {
      return NextResponse.json({
        valid: false,
        reason: "Codigo de cupon no encontrado",
      });
    }

    const promoDoc = promoSnap.docs[0];
    const promo = promoDoc.data();

    // Check active
    if (!promo.isActive) {
      return NextResponse.json({
        valid: false,
        reason: "Este cupon esta desactivado",
      });
    }

    // Check date range
    const now = new Date();
    const validFrom = promo.rules.validFrom.toDate
      ? promo.rules.validFrom.toDate()
      : new Date(promo.rules.validFrom);
    const validUntil = promo.rules.validUntil.toDate
      ? promo.rules.validUntil.toDate()
      : new Date(promo.rules.validUntil);

    if (now < validFrom) {
      return NextResponse.json({
        valid: false,
        reason: "Este cupon aun no esta vigente",
      });
    }
    if (now > validUntil) {
      return NextResponse.json({
        valid: false,
        reason: "Este cupon ha expirado",
      });
    }

    // Check max total uses
    if (
      promo.rules.maxTotalUses &&
      promo.currentUses >= promo.rules.maxTotalUses
    ) {
      return NextResponse.json({
        valid: false,
        reason: "Este cupon ha alcanzado su limite de usos",
      });
    }

    // Check per-user limit
    if (promo.rules.maxUsesPerUser) {
      const userUsages = await dbAdmin
        .collection("promotions")
        .doc(promoDoc.id)
        .collection("usages")
        .where("userId", "==", userId)
        .count()
        .get();

      if (userUsages.data().count >= promo.rules.maxUsesPerUser) {
        return NextResponse.json({
          valid: false,
          reason: "Ya has usado este cupon el maximo de veces permitido",
        });
      }
    }

    // Check min purchase
    if (promo.rules.minPurchaseAmount && subtotal < promo.rules.minPurchaseAmount) {
      return NextResponse.json({
        valid: false,
        reason: `La compra minima para este cupon es $${promo.rules.minPurchaseAmount.toFixed(2)}`,
      });
    }

    // Check applicable categories/products
    if (
      promo.rules.applicableProductIds &&
      promo.rules.applicableProductIds.length > 0
    ) {
      const applicableItems = items.filter((item) =>
        promo.rules.applicableProductIds.includes(item.productId),
      );
      if (applicableItems.length === 0) {
        return NextResponse.json({
          valid: false,
          reason: "Este cupon no aplica para los productos en tu carrito",
        });
      }
    }

    // Calculate discount
    let discount = 0;
    if (promo.type === "percentage") {
      discount = subtotal * (promo.value / 100);
      if (promo.maxDiscountAmount) {
        discount = Math.min(discount, promo.maxDiscountAmount);
      }
    } else if (promo.type === "fixed_amount") {
      discount = Math.min(promo.value, subtotal);
    }
    // free_shipping: discount stays 0, but type indicates free shipping

    discount = Math.round(discount * 100) / 100;

    return NextResponse.json({
      valid: true,
      discount,
      promotionId: promoDoc.id,
      type: promo.type,
      description: promo.description || promo.name,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { valid: false, reason: "Error al validar el cupon" },
      { status: 500 },
    );
  }
}

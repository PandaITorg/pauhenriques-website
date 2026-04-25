import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!(await requireSection(request, "dashboard"))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!dbAdmin) {
      return NextResponse.json({ error: "DB not available" }, { status: 500 });
    }

    const [productsSnap, ordersSnap] = await Promise.all([
      dbAdmin.collection("products").count().get(),
      dbAdmin.collection("orders").count().get(),
    ]);

    // Recent orders: last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSnap = await dbAdmin
      .collection("orders")
      .where("createdAt", ">=", sevenDaysAgo)
      .count()
      .get();

    return NextResponse.json({
      totalProducts: productsSnap.data().count,
      totalOrders: ordersSnap.data().count,
      recentOrders: recentSnap.data().count,
    });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

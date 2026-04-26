import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

interface RecentPayment {
  orderId: string;
  total: number;
  customerName: string;
  customerEmail: string;
  paidAt: string | null;
  hasCourseId: boolean;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await requireSection(request, "dashboard"))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!dbAdmin) {
      return NextResponse.json({ error: "DB not available" }, { status: 500 });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      productsSnap,
      ordersSnap,
      recentSnap,
      activeTalleresSnap,
      monthEnrollmentsSnap,
      recentPaidOrdersSnap,
    ] = await Promise.all([
      dbAdmin.collection("products").count().get(),
      dbAdmin.collection("orders").count().get(),
      dbAdmin
        .collection("orders")
        .where("createdAt", ">=", sevenDaysAgo)
        .count()
        .get(),
      dbAdmin
        .collection("talleres")
        .where("active", "==", true)
        .count()
        .get()
        .catch(() => null),
      dbAdmin
        .collection("courseEnrollments")
        .where("paidAt", ">=", Timestamp.fromDate(monthStart))
        .count()
        .get()
        .catch(() => null),
      dbAdmin
        .collection("orders")
        .where("status", "==", "paid")
        .orderBy("chargeResponseAt", "desc")
        .limit(5)
        .get()
        .catch(() => null),
    ]);

    const recentPayments: RecentPayment[] = recentPaidOrdersSnap
      ? recentPaidOrdersSnap.docs.map((doc) => {
          const d = doc.data();
          const paidAtRaw = d.chargeResponseAt;
          const paidAt =
            paidAtRaw instanceof Timestamp
              ? paidAtRaw.toDate().toISOString()
              : paidAtRaw instanceof Date
                ? paidAtRaw.toISOString()
                : null;
          const guestName =
            d.guestInfo?.firstName && d.guestInfo?.lastName
              ? `${d.guestInfo.firstName} ${d.guestInfo.lastName}`
              : d.shippingAddress?.fullName || "—";
          return {
            orderId: doc.id,
            total: typeof d.total === "number" ? d.total : 0,
            customerName: guestName,
            customerEmail: d.guestInfo?.email || d.userEmail || "—",
            paidAt,
            hasCourseId: typeof d.courseId === "string" && d.courseId.length > 0,
          };
        })
      : [];

    return NextResponse.json({
      totalProducts: productsSnap.data().count,
      totalOrders: ordersSnap.data().count,
      recentOrders: recentSnap.data().count,
      activeTalleres: activeTalleresSnap ? activeTalleresSnap.data().count : null,
      monthEnrollments: monthEnrollmentsSnap
        ? monthEnrollmentsSnap.data().count
        : null,
      recentPayments,
    });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

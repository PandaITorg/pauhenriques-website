import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase-admin";
import { getAdminSessionFromRequest } from "@/lib/auth/server";
import { hasAccess } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

// Inbox del admin: agrega counts de items que requieren atención.
// Usa count() de Firestore (agregación server-side, no descarga docs).
// Cada count se calcula solo si el user tiene acceso a esa sección — los
// que no, devuelven null para que el cliente no muestre la card.
export async function GET(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const canCursos = hasAccess(session.role, "cursos");
  const canAuditoria = hasAccess(session.role, "auditoria");
  const canPedidos = hasAccess(session.role, "pedidos");

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  // Lanzamos en paralelo todo lo que el user tenga permiso de ver.
  const [pendingAccessSnap, expiringLinksSnap, missingAuthSnap, reviewOrdersSnap] =
    await Promise.all([
      canCursos
        ? dbAdmin
            .collection("courseEnrollments")
            .where("accessStatus", "==", "pending_access")
            .count()
            .get()
        : null,
      canCursos
        ? dbAdmin
            .collection("paymentLinks")
            .where("active", "==", true)
            .where("expiresAt", "<=", Timestamp.fromDate(sevenDaysFromNow))
            .where("expiresAt", ">", Timestamp.fromDate(new Date()))
            .count()
            .get()
            .catch(() => null) // Si falta composite index, ignorar (no rompe el dashboard)
        : null,
      canAuditoria
        ? dbAdmin
            .collection("orders")
            .where("missingAuthCodeFlagged", "==", true)
            .count()
            .get()
            .catch(() => null)
        : null,
      canPedidos
        ? dbAdmin
            .collection("orders")
            .where("status", "==", "pending")
            .count()
            .get()
            .catch(() => null)
        : null,
    ]);

  return NextResponse.json({
    pendingAccess: pendingAccessSnap ? pendingAccessSnap.data().count : null,
    expiringLinks: expiringLinksSnap ? expiringLinksSnap.data().count : null,
    missingAuthCode: missingAuthSnap ? missingAuthSnap.data().count : null,
    pendingOrders: reviewOrdersSnap ? reviewOrdersSnap.data().count : null,
  });
}

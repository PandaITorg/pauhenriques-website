import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const CSV_HEADERS = [
  "Fecha pago",
  "Nombre",
  "Apellido",
  "Email",
  "Telefono",
  "Cedula",
  "Monto USD",
  "Taller",
  "Estado acceso",
  "Acceso enviado",
  "Notas",
  "Etiqueta promo",
  "Order ID",
  "Transaction ID",
  "Auth code",
  "Devuelto",
];

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatDate(v: unknown): string {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return "";
}

function toMillis(v: unknown): number {
  if (v instanceof Timestamp) return v.toDate().getTime();
  if (v instanceof Date) return v.getTime();
  if (typeof v === "string") {
    const t = new Date(v).getTime();
    return isNaN(t) ? 0 : t;
  }
  return 0;
}

export async function GET(request: NextRequest) {
  const session = await requireSection(request, "cursos");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const fromStr = searchParams.get("from"); // YYYY-MM-DD
  const toStr = searchParams.get("to"); // YYYY-MM-DD

  // Parsear filtros de fecha (inclusivo). Día completo en hora local server.
  const fromMs = fromStr ? new Date(`${fromStr}T00:00:00`).getTime() : null;
  const toMs = toStr ? new Date(`${toStr}T23:59:59.999`).getTime() : null;

  // Cuando hay filter por courseId, traemos sin orderBy para evitar
  // composite index. Si no hay filter, ordenamos server-side.
  let snap: FirebaseFirestore.QuerySnapshot;
  if (courseId) {
    snap = await dbAdmin
      .collection("courseEnrollments")
      .where("courseId", "==", courseId)
      .limit(5000)
      .get();
  } else {
    snap = await dbAdmin
      .collection("courseEnrollments")
      .orderBy("paidAt", "desc")
      .limit(5000)
      .get();
  }

  // Sort en memoria + filtro por rango de fechas
  let docs = courseId
    ? [...snap.docs].sort((a, b) => toMillis(b.data().paidAt) - toMillis(a.data().paidAt))
    : snap.docs;

  if (fromMs !== null || toMs !== null) {
    docs = docs.filter((doc) => {
      const t = toMillis(doc.data().paidAt);
      if (fromMs !== null && t < fromMs) return false;
      if (toMs !== null && t > toMs) return false;
      return true;
    });
  }

  // Lookup tables: talleres por id (para nombre), orders por id
  // (transactionId + authCode), payment links por id (publicLabel).
  const courseIds = new Set<string>();
  const orderIds = new Set<string>();
  const linkIds = new Set<string>();
  for (const doc of docs) {
    const d = doc.data();
    if (typeof d.courseId === "string") courseIds.add(d.courseId);
    if (typeof d.orderId === "string") orderIds.add(d.orderId);
    if (typeof d.paymentLinkId === "string") linkIds.add(d.paymentLinkId);
  }

  const [tallerNameMap, orderMetaMap, linkMetaMap] = await Promise.all([
    fetchTallerNames(dbAdmin, [...courseIds]),
    fetchOrderMeta(dbAdmin, [...orderIds]),
    fetchLinkMeta(dbAdmin, [...linkIds]),
  ]);

  const rows: string[] = [];
  rows.push(CSV_HEADERS.join(","));

  for (const doc of docs) {
    const d = doc.data();
    const tallerName =
      typeof d.courseId === "string" ? (tallerNameMap.get(d.courseId) ?? d.courseId) : "";
    const orderMeta = typeof d.orderId === "string" ? orderMetaMap.get(d.orderId) : null;
    const linkMeta = typeof d.paymentLinkId === "string" ? linkMetaMap.get(d.paymentLinkId) : null;
    rows.push(
      [
        formatDate(d.paidAt),
        csvEscape(d.customerFirstName ?? ""),
        csvEscape(d.customerLastName ?? ""),
        csvEscape(d.customerEmail ?? ""),
        csvEscape(d.customerPhone ?? ""),
        csvEscape(d.customerIdNumber ?? ""),
        typeof d.amountPaid === "number" ? d.amountPaid.toFixed(2) : "",
        csvEscape(tallerName),
        csvEscape(d.accessStatus ?? ""),
        formatDate(d.accessSentAt),
        csvEscape(d.notes ?? ""),
        csvEscape(linkMeta?.publicLabel ?? ""),
        csvEscape(d.orderId ?? ""),
        csvEscape(orderMeta?.paymentTransactionId ?? ""),
        csvEscape(orderMeta?.authorizationCode ?? ""),
        formatDate(d.refundedAt),
      ].join(","),
    );
  }

  const csv = "﻿" + rows.join("\r\n");
  const today = new Date().toISOString().slice(0, 10);
  const filenameSuffix = courseId ? `-${courseId.slice(0, 6)}` : "";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inscripciones${filenameSuffix}-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

async function fetchTallerNames(
  db: FirebaseFirestore.Firestore,
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const docs = await Promise.all(ids.map((id) => db.collection("talleres").doc(id).get()));
  for (const doc of docs) {
    if (!doc.exists) continue;
    const name = doc.data()?.name;
    if (typeof name === "string") map.set(doc.id, name);
  }
  return map;
}

async function fetchOrderMeta(
  db: FirebaseFirestore.Firestore,
  ids: string[],
): Promise<
  Map<string, { paymentTransactionId: string | null; authorizationCode: string | null }>
> {
  const map = new Map<
    string,
    { paymentTransactionId: string | null; authorizationCode: string | null }
  >();
  if (ids.length === 0) return map;
  const docs = await Promise.all(ids.map((id) => db.collection("orders").doc(id).get()));
  for (const doc of docs) {
    if (!doc.exists) continue;
    const d = doc.data() ?? {};
    map.set(doc.id, {
      paymentTransactionId:
        typeof d.paymentTransactionId === "string" ? d.paymentTransactionId : null,
      authorizationCode:
        typeof d.authorizationCode === "string" ? d.authorizationCode : null,
    });
  }
  return map;
}

async function fetchLinkMeta(
  db: FirebaseFirestore.Firestore,
  ids: string[],
): Promise<Map<string, { publicLabel: string | null }>> {
  const map = new Map<string, { publicLabel: string | null }>();
  if (ids.length === 0) return map;
  const docs = await Promise.all(ids.map((id) => db.collection("paymentLinks").doc(id).get()));
  for (const doc of docs) {
    if (!doc.exists) continue;
    const d = doc.data() ?? {};
    map.set(doc.id, {
      publicLabel: typeof d.publicLabel === "string" ? d.publicLabel : null,
    });
  }
  return map;
}

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
  "Estado acceso",
  "Acceso enviado",
  "Order ID",
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

  // Cuando hay filter por courseId, ordenamos en memoria (evita composite
  // index courseId + paidAt). Volumen por taller es chico.
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

  const docs = courseId
    ? [...snap.docs].sort((a, b) => {
        const aT =
          a.data().paidAt?.toDate?.()?.getTime?.() ??
          a.data().paidAt?.getTime?.() ??
          0;
        const bT =
          b.data().paidAt?.toDate?.()?.getTime?.() ??
          b.data().paidAt?.getTime?.() ??
          0;
        return bT - aT;
      })
    : snap.docs;

  const rows: string[] = [];
  rows.push(CSV_HEADERS.join(","));

  for (const doc of docs) {
    const d = doc.data();
    rows.push(
      [
        formatDate(d.paidAt),
        csvEscape(d.customerFirstName ?? ""),
        csvEscape(d.customerLastName ?? ""),
        csvEscape(d.customerEmail ?? ""),
        csvEscape(d.customerPhone ?? ""),
        csvEscape(d.customerIdNumber ?? ""),
        typeof d.amountPaid === "number" ? d.amountPaid.toFixed(2) : "",
        csvEscape(d.accessStatus ?? ""),
        formatDate(d.accessSentAt),
        csvEscape(d.orderId ?? ""),
      ].join(","),
    );
  }

  const csv = "﻿" + rows.join("\r\n");
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inscripciones-taller-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

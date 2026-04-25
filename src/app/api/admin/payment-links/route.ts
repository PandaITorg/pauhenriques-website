import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";
import {
  PAYMENT_LINK_PRICE_MAX,
  PAYMENT_LINK_PRICE_MIN,
  generatePaymentLinkToken,
  type PaymentLink,
} from "@/lib/pago-link/paymentLink";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  price: z
    .number()
    .finite()
    .min(PAYMENT_LINK_PRICE_MIN, `Minimo $${PAYMENT_LINK_PRICE_MIN}`)
    .max(PAYMENT_LINK_PRICE_MAX, `Maximo $${PAYMENT_LINK_PRICE_MAX}`),
  label: z.string().trim().min(1, "Nombre interno requerido").max(80),
  publicLabel: z.string().trim().max(60).optional(),
  notes: z.string().trim().max(500).optional(),
  expiresAt: z
    .string()
    .datetime({ offset: true })
    .refine((v) => new Date(v).getTime() > Date.now(), {
      message: "La fecha de expiracion debe ser en el futuro",
    }),
  tallerId: z.string().min(1, "tallerId requerido"),
});

function docToPaymentLink(doc: FirebaseFirestore.DocumentSnapshot): PaymentLink {
  const d = doc.data() ?? {};
  const toIso = (v: unknown): string | null => {
    if (v instanceof Timestamp) return v.toDate().toISOString();
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "string") return v;
    return null;
  };
  // Compat: docs antiguos tienen `productId`, los nuevos `tallerId`. La
  // migración (commit 5) renombra todos a `tallerId`, pero el dual-read
  // queda como red de seguridad por si quedó algún residuo.
  const tallerId =
    typeof d.tallerId === "string"
      ? d.tallerId
      : typeof d.productId === "string"
        ? d.productId
        : "";
  return {
    id: doc.id,
    token: typeof d.token === "string" ? d.token : "",
    tallerId,
    price: typeof d.price === "number" ? d.price : 0,
    label: typeof d.label === "string" ? d.label : null,
    publicLabel: typeof d.publicLabel === "string" ? d.publicLabel : null,
    notes: typeof d.notes === "string" ? d.notes : null,
    active: d.active !== false,
    expiresAt: toIso(d.expiresAt) ?? new Date(0).toISOString(),
    createdByUid: typeof d.createdByUid === "string" ? d.createdByUid : "",
    createdByEmail: typeof d.createdByEmail === "string" ? d.createdByEmail : null,
    createdByName: typeof d.createdByName === "string" ? d.createdByName : null,
    timesPaid: typeof d.timesPaid === "number" ? d.timesPaid : 0,
    lastPaidAt: toIso(d.lastPaidAt),
    createdAt: toIso(d.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(d.updatedAt) ?? new Date().toISOString(),
  };
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
  const tallerId = searchParams.get("tallerId");

  // Cuando hay filter por tallerId, ordenamos en memoria. Evita necesitar
  // un composite index (tallerId + createdAt). El volumen por taller es
  // pequeño (decenas/cientos), así que el sort en cliente es trivial.
  let snap: FirebaseFirestore.QuerySnapshot;
  if (tallerId) {
    snap = await dbAdmin
      .collection("paymentLinks")
      .where("tallerId", "==", tallerId)
      .limit(500)
      .get();
  } else {
    snap = await dbAdmin
      .collection("paymentLinks")
      .orderBy("createdAt", "desc")
      .limit(500)
      .get();
  }

  const links = snap.docs.map(docToPaymentLink);
  if (tallerId) {
    links.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  return NextResponse.json({ links });
}

export async function POST(request: NextRequest) {
  const session = await requireSection(request, "cursos");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos invalidos" },
      { status: 400 },
    );
  }
  const { price, label, publicLabel, notes, expiresAt, tallerId } = parsed.data;

  // Verificar que el taller existe y está activo antes de crear el link.
  const tallerSnap = await dbAdmin.collection("talleres").doc(tallerId).get();
  if (!tallerSnap.exists) {
    return NextResponse.json({ error: "Taller no encontrado" }, { status: 404 });
  }
  if (tallerSnap.data()?.active === false) {
    return NextResponse.json(
      { error: "El taller está inactivo" },
      { status: 409 },
    );
  }

  const token = generatePaymentLinkToken();

  try {
    const ref = await dbAdmin.collection("paymentLinks").add({
      token,
      tallerId,
      price: Math.round(price * 100) / 100,
      label,
      publicLabel: publicLabel ?? null,
      notes: notes ?? null,
      active: true,
      expiresAt: Timestamp.fromDate(new Date(expiresAt)),
      createdByUid: session.uid,
      createdByEmail: session.email,
      createdByName: null,
      timesPaid: 0,
      lastPaidAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const snap = await ref.get();
    return NextResponse.json({ link: docToPaymentLink(snap) }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creando link";
    console.error("[payment-links][POST]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

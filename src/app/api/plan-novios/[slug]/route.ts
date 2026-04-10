import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    if (!slug || !dbAdmin) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const snapshot = await dbAdmin
      .collection("planNovios")
      .where("slug", "==", slug)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Compute progress percentage (ambiguous — no dollar amounts exposed)
    const goalAmount = data.goalAmount ?? 0;
    const totalContributed = data.totalContributed ?? 0;
    const progressPercent = goalAmount > 0
      ? Math.min(100, Math.round((totalContributed / goalAmount) * 100))
      : null;

    // Return only public info — never expose financial data
    return NextResponse.json({
      id: doc.id,
      partner1Name: data.partner1Name,
      partner2Name: data.partner2Name,
      weddingDate: data.weddingDate,
      message: data.message,
      coverImage: data.coverImage || null,
      slug: data.slug,
      status: data.status,
      progressPercent,
    });
  } catch (error) {
    console.error("[plan-novios/slug] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

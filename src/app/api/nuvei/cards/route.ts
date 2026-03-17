import { NextRequest, NextResponse } from "next/server";
import { auth, dbAdmin } from "@/lib/firebase-admin";
import { listCards, deleteCard } from "@/lib/nuvei";

export const dynamic = "force-dynamic";

async function verifySession(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie || !auth) return null;
  try {
    return await auth.verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}

// GET /api/nuvei/cards — list saved cards for the current user
export async function GET(request: NextRequest) {
  const decoded = await verifySession(request);
  if (!decoded) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await listCards(decoded.uid);

    // Filter to only valid/review cards
    const cards = (result.cards || []).filter(
      (c) => c.status === "valid" || c.status === "review",
    );

    // Check Firestore for locally verified cards (Nuvei may still report "review")
    if (dbAdmin && cards.some((c) => c.status === "review")) {
      const verifiedDoc = await dbAdmin
        .collection("users")
        .doc(decoded.uid)
        .collection("verifiedCards")
        .get();
      const verifiedTokens = new Set(verifiedDoc.docs.map((d) => d.id));

      const enrichedCards = cards.map((c) =>
        c.status === "review" && verifiedTokens.has(c.token)
          ? { ...c, status: "valid" as const }
          : c,
      );
      return NextResponse.json({ cards: enrichedCards });
    }

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Error listing cards:", error);
    return NextResponse.json(
      { error: "Error al obtener tarjetas" },
      { status: 500 },
    );
  }
}

// DELETE /api/nuvei/cards — delete a saved card
export async function DELETE(request: NextRequest) {
  const decoded = await verifySession(request);
  if (!decoded) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json(
        { error: "Token de tarjeta requerido" },
        { status: 400 },
      );
    }

    const result = await deleteCard(token, decoded.uid);

    // Also remove from verified cards if exists
    if (dbAdmin) {
      try {
        await dbAdmin
          .collection("users")
          .doc(decoded.uid)
          .collection("verifiedCards")
          .doc(token)
          .delete();
      } catch { /* ignore if doesn't exist */ }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting card:", error);
    return NextResponse.json(
      { error: "Error al eliminar tarjeta" },
      { status: 500 },
    );
  }
}

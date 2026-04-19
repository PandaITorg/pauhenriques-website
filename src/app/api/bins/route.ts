import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/bins — serves the BIN database from Firestore at config/bins.
 * Cached at the CDN edge for 24 hours; stale-while-revalidate for a week.
 * Clients also cache in localStorage and re-fetch only when the version changes.
 */
export async function GET() {
  if (!dbAdmin) {
    return NextResponse.json(
      { error: "Firestore not initialized" },
      { status: 500 },
    );
  }

  try {
    const doc = await dbAdmin.collection("config").doc("bins").get();
    if (!doc.exists) {
      return NextResponse.json(
        { data: {}, version: "empty", count: 0 },
        {
          headers: {
            "Cache-Control": "public, max-age=300",
          },
        },
      );
    }

    const docData = doc.data()!;
    return NextResponse.json(
      {
        data: docData.data || {},
        version: docData.version || "unknown",
        count: docData.count || 0,
      },
      {
        headers: {
          // 24 h fresh, 7 d stale-while-revalidate
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (err) {
    console.error("[bins] Error reading config/bins:", err);
    return NextResponse.json(
      { error: "Failed to load BIN database" },
      { status: 500 },
    );
  }
}

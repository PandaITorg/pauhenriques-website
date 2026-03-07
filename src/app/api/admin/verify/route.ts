import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie || !auth) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    return NextResponse.json({ isAdmin: decoded.admin === true });
  } catch {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }
}

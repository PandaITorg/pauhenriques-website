import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ isAdmin: false, role: null }, { status: 401 });
  }
  return NextResponse.json({
    isAdmin: true,
    role: session.role,
    uid: session.uid,
    email: session.email,
  });
}

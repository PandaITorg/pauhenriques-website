import { NextRequest, NextResponse } from "next/server";
import { auth, dbAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

async function verifyAdmin(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie || !auth) return false;
  try {
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    return decoded.admin === true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const snapshot = await dbAdmin
    .collection("homepage_slides")
    .orderBy("order")
    .get();

  const slides = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
    updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() ?? null,
  }));

  return NextResponse.json(slides);
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const body = await request.json();
  const now = new Date();

  const slideData = {
    title: body.title ?? "",
    subtitle: body.subtitle ?? "",
    imageUrl: body.imageUrl ?? "",
    imageMobile: body.imageMobile ?? "",
    videoUrl: body.videoUrl ?? "",
    ctaText: body.ctaText ?? "",
    ctaLink: body.ctaLink ?? "",
    ctaStyle: body.ctaStyle ?? "primary",
    template: body.template ?? "full-image",
    textStyle: body.textStyle ?? "none",
    overlayOpacity: body.overlayOpacity ?? 0.5,
    order: body.order ?? 0,
    active: body.active ?? true,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await dbAdmin.collection("homepage_slides").add(slideData);

  return NextResponse.json({ id: docRef.id }, { status: 201 });
}

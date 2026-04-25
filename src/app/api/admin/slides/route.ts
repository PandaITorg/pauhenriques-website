import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await requireSection(request, "homepage"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const snapshot = await dbAdmin
    .collection("hero_slides")
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
  if (!(await requireSection(request, "homepage"))) {
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
    // Granular customization
    kicker: body.kicker ?? "",
    titleFont: body.titleFont ?? "cormorant",
    titleSize: body.titleSize ?? "lg",
    titleColor: body.titleColor ?? "#ffffff",
    accentWord: body.accentWord ?? "",
    textPosition: body.textPosition ?? "bottom-left",
    textBackground: body.textBackground ?? "gradient-left",
    overlayDirection: body.overlayDirection ?? "left",
    imageEffect: body.imageEffect ?? "ken-burns",
    order: body.order ?? 0,
    active: body.active ?? true,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await dbAdmin.collection("hero_slides").add(slideData);

  revalidatePath("/");

  return NextResponse.json({ id: docRef.id }, { status: 201 });
}

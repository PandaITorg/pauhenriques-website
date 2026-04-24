import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { sendCourseAccessEmail } from "@/lib/email";
import { CURSO_TOXICA_SIN_TOXICOS } from "@/lib/pago-link/course";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const COURSE_NAME_BY_ID: Record<string, string> = {
  [CURSO_TOXICA_SIN_TOXICOS.productId]: CURSO_TOXICA_SIN_TOXICOS.name,
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireSection(request, "cursos"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const { id } = await params;
  const body = await request.json();
  const accessLink: string | undefined = body?.accessLink?.trim();
  const customMessage: string | undefined = body?.customMessage?.trim() || undefined;
  const markOnly: boolean = body?.markOnly === true;

  if (!accessLink && !markOnly) {
    return NextResponse.json(
      { error: "accessLink es requerido" },
      { status: 400 },
    );
  }

  if (accessLink && !/^https?:\/\//i.test(accessLink)) {
    return NextResponse.json(
      { error: "El link debe empezar con http:// o https://" },
      { status: 400 },
    );
  }

  const ref = dbAdmin.collection("courseEnrollments").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 });
  }

  const data = snap.data()!;
  const customerName = `${data.customerFirstName ?? ""} ${data.customerLastName ?? ""}`.trim();
  const courseName = COURSE_NAME_BY_ID[data.courseId] ?? data.courseId;

  let emailSent = false;
  if (!markOnly && accessLink) {
    const result = await sendCourseAccessEmail({
      to: data.customerEmail,
      customerName,
      courseName,
      accessLink,
      customMessage,
    });
    emailSent = result.success;
    if (!emailSent) {
      return NextResponse.json(
        { error: "El email no pudo enviarse. Revisá la configuración de Resend." },
        { status: 502 },
      );
    }
  }

  await ref.update({
    accessStatus: "access_sent",
    accessLink: accessLink || null,
    accessSentAt: new Date(),
    ...(customMessage ? { accessMessage: customMessage } : {}),
    updatedAt: new Date(),
  });

  return NextResponse.json({ ok: true, emailSent });
}

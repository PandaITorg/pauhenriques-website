import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase-admin";
import { uploadFile, deleteFile, urlToFilePath } from "@/lib/storage";
import crypto from "crypto";

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

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const productId = formData.get("productId") as string | null;
  const folderParam = formData.get("folder") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Usa JPG, PNG, WebP o AVIF." },
      { status: 400 },
    );
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "El archivo excede 5MB" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "jpg";
  const uniqueName = `${crypto.randomUUID()}.${ext}`;
  const folder = folderParam || (productId ? `products/${productId}` : "products/temp");
  const filePath = `${folder}/${uniqueName}`;

  const url = await uploadFile(buffer, filePath, file.type);

  return NextResponse.json({ url, filePath });
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { url } = await request.json();
  if (!url) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }

  const filePath = urlToFilePath(url);
  if (filePath) {
    await deleteFile(filePath);
  }

  return NextResponse.json({ success: true });
}

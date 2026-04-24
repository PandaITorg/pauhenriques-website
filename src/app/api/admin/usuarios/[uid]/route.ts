import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { auth, dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";
import { ROLES, getRoleFromClaims, type Role } from "@/lib/auth/roles";
import { writeUserAudit } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";

const UpdateUserSchema = z
  .object({
    role: z.enum(ROLES as readonly [Role, ...Role[]]).optional(),
    password: z.string().min(8, "Minimo 8 caracteres").max(128).optional(),
    nombre: z.string().trim().min(2).max(50).optional(),
    apellido: z.string().trim().min(2).max(50).optional(),
    telefono: z.string().trim().max(40).optional(),
  })
  .refine(
    (d) =>
      d.role !== undefined ||
      d.password !== undefined ||
      d.nombre !== undefined ||
      d.apellido !== undefined ||
      d.telefono !== undefined,
    { message: "Sin cambios" },
  );

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const session = await requireSection(request, "usuarios");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!auth || !dbAdmin) {
    return NextResponse.json({ error: "Backend not available" }, { status: 500 });
  }

  const { uid } = await params;
  if (uid === session.uid) {
    return NextResponse.json(
      { error: "No puedes modificar tu propio usuario desde aqui" },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = UpdateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos invalidos" },
      { status: 400 },
    );
  }

  try {
    const target = await auth.getUser(uid).catch(() => null);
    if (!target) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const previousRole = getRoleFromClaims(
      target.customClaims as Record<string, unknown> | undefined,
    );
    if (!previousRole) {
      return NextResponse.json(
        { error: "El usuario no es parte del equipo" },
        { status: 400 },
      );
    }

    const { role, password, nombre, apellido, telefono } = parsed.data;

    const profileRef = dbAdmin.collection("users").doc(uid);
    const profileSnap = await profileRef.get();
    const existingProfile = profileSnap.exists ? profileSnap.data() ?? {} : {};

    const effectiveNombre =
      nombre ??
      (typeof existingProfile.nombre === "string"
        ? existingProfile.nombre
        : undefined);
    const effectiveApellido =
      apellido ??
      (typeof existingProfile.apellido === "string"
        ? existingProfile.apellido
        : undefined);

    const nameChanged = nombre !== undefined || apellido !== undefined;
    const newDisplayName =
      nameChanged && effectiveNombre && effectiveApellido
        ? `${effectiveNombre} ${effectiveApellido}`.trim()
        : undefined;

    if (password !== undefined || newDisplayName !== undefined) {
      await auth.updateUser(uid, {
        ...(password !== undefined ? { password } : {}),
        ...(newDisplayName !== undefined ? { displayName: newDisplayName } : {}),
      });
    }

    const profileUpdates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (nombre !== undefined) profileUpdates.nombre = nombre;
    if (apellido !== undefined) profileUpdates.apellido = apellido;
    if (telefono !== undefined) profileUpdates.telefono = telefono.length > 0 ? telefono : null;

    const hasProfileChanges =
      nombre !== undefined || apellido !== undefined || telefono !== undefined;

    if (hasProfileChanges || !profileSnap.exists) {
      // Lazy backfill: si el doc no existe, lo creamos con la mejor info disponible.
      if (!profileSnap.exists) {
        const fallbackParts = (target.displayName ?? "").trim().split(/\s+/);
        const fallbackNombre = fallbackParts[0] ?? "";
        const fallbackApellido =
          fallbackParts.length > 1 ? fallbackParts.slice(1).join(" ") : "";
        await profileRef.set({
          uid,
          nombre: nombre ?? fallbackNombre,
          apellido: apellido ?? fallbackApellido,
          email: target.email ?? null,
          telefono:
            telefono !== undefined
              ? telefono.length > 0
                ? telefono
                : null
              : null,
          photoURL: target.photoURL ?? null,
          provider: "email",
          role: "customer",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else if (hasProfileChanges) {
        await profileRef.update(profileUpdates);
      }
    }

    if (role !== undefined && role !== previousRole) {
      await auth.setCustomUserClaims(uid, { role });
    }

    if (
      (role !== undefined && role !== previousRole) ||
      password !== undefined
    ) {
      await auth.revokeRefreshTokens(uid);
    }

    if (role !== undefined && role !== previousRole) {
      await writeUserAudit(session, {
        action: "update-role",
        target: { uid, email: target.email ?? null },
        previousRole,
        newRole: role,
      });
    }
    if (password !== undefined) {
      await writeUserAudit(session, {
        action: "update-password",
        target: { uid, email: target.email ?? null },
      });
    }
    if (nameChanged || telefono !== undefined) {
      await writeUserAudit(session, {
        action: "update-displayName",
        target: { uid, email: target.email ?? null },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error actualizando usuario";
    console.error("[admin-usuarios][PATCH]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const session = await requireSection(request, "usuarios");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!auth || !dbAdmin) {
    return NextResponse.json({ error: "Backend not available" }, { status: 500 });
  }

  const { uid } = await params;
  if (uid === session.uid) {
    return NextResponse.json(
      { error: "No puedes eliminar tu propio usuario" },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const confirmEmail = searchParams.get("confirmEmail")?.trim().toLowerCase();

  try {
    const target = await auth.getUser(uid).catch(() => null);
    if (!target) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (!confirmEmail || confirmEmail !== (target.email ?? "").toLowerCase()) {
      return NextResponse.json(
        { error: "Confirmacion de email no coincide" },
        { status: 400 },
      );
    }

    const previousRole = getRoleFromClaims(
      target.customClaims as Record<string, unknown> | undefined,
    );

    await auth.deleteUser(uid);
    await dbAdmin.collection("users").doc(uid).delete().catch(() => {});

    await writeUserAudit(session, {
      action: "delete",
      target: { uid, email: target.email ?? null },
      previousRole: previousRole ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error eliminando usuario";
    console.error("[admin-usuarios][DELETE]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

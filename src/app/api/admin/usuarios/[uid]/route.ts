import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";
import { ROLES, getRoleFromClaims, type Role } from "@/lib/auth/roles";
import { writeUserAudit } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";

const UpdateUserSchema = z
  .object({
    role: z.enum(ROLES as readonly [Role, ...Role[]]).optional(),
    password: z.string().min(8, "Minimo 8 caracteres").max(128).optional(),
    displayName: z.string().trim().min(1).max(80).optional(),
  })
  .refine(
    (d) => d.role !== undefined || d.password !== undefined || d.displayName !== undefined,
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
  if (!auth) {
    return NextResponse.json({ error: "Auth not available" }, { status: 500 });
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

    const { role, password, displayName } = parsed.data;

    if (password !== undefined || displayName !== undefined) {
      await auth.updateUser(uid, {
        ...(password !== undefined ? { password } : {}),
        ...(displayName !== undefined ? { displayName } : {}),
      });
    }

    if (role !== undefined && role !== previousRole) {
      await auth.setCustomUserClaims(uid, { role });
    }

    // Revoke refresh tokens on role or password change to force re-login.
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
    if (displayName !== undefined) {
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
  if (!auth) {
    return NextResponse.json({ error: "Auth not available" }, { status: 500 });
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

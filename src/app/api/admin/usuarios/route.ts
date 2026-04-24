import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";
import { ROLES, getRoleFromClaims, type Role } from "@/lib/auth/roles";
import { writeUserAudit } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";

const CreateUserSchema = z.object({
  email: z.string().email("Email invalido").transform((s) => s.trim().toLowerCase()),
  password: z.string().min(8, "Minimo 8 caracteres").max(128),
  displayName: z.string().trim().min(1).max(80).optional(),
  role: z.enum(ROLES as readonly [Role, ...Role[]]),
});

interface UserListItem {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: Role;
  disabled: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
}

export async function GET(request: NextRequest) {
  const session = await requireSection(request, "usuarios");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!auth) {
    return NextResponse.json({ error: "Auth not available" }, { status: 500 });
  }

  const users: UserListItem[] = [];
  let pageToken: string | undefined;

  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const u of page.users) {
      const role = getRoleFromClaims(
        u.customClaims as Record<string, unknown> | undefined,
      );
      if (!role) continue;
      users.push({
        uid: u.uid,
        email: u.email ?? null,
        displayName: u.displayName ?? null,
        role,
        disabled: u.disabled,
        createdAt: u.metadata.creationTime ?? null,
        lastSignInAt: u.metadata.lastSignInTime ?? null,
      });
    }
    pageToken = page.pageToken;
  } while (pageToken);

  users.sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const session = await requireSection(request, "usuarios");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!auth) {
    return NextResponse.json({ error: "Auth not available" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos invalidos" },
      { status: 400 },
    );
  }
  const { email, password, displayName, role } = parsed.data;

  try {
    const existing = await auth.getUserByEmail(email).catch(() => null);
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email" },
        { status: 409 },
      );
    }

    const created = await auth.createUser({
      email,
      password,
      displayName: displayName ?? undefined,
      emailVerified: true,
    });
    await auth.setCustomUserClaims(created.uid, { role });

    await writeUserAudit(session, {
      action: "create",
      target: { uid: created.uid, email: created.email ?? email },
      newRole: role,
    });

    return NextResponse.json(
      {
        uid: created.uid,
        email: created.email,
        displayName: created.displayName ?? null,
        role,
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creando usuario";
    console.error("[admin-usuarios][POST]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

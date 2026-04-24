import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { auth, dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";
import { ROLES, getRoleFromClaims, type Role } from "@/lib/auth/roles";
import { writeUserAudit } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";

const CreateUserSchema = z.object({
  email: z.string().email("Email invalido").transform((s) => s.trim().toLowerCase()),
  password: z.string().min(8, "Minimo 8 caracteres").max(128),
  nombre: z.string().trim().min(2, "Minimo 2 caracteres").max(50),
  apellido: z.string().trim().min(2, "Minimo 2 caracteres").max(50),
  telefono: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  role: z.enum(ROLES as readonly [Role, ...Role[]]),
});

interface UserListItem {
  uid: string;
  email: string | null;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
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
  if (!auth || !dbAdmin) {
    return NextResponse.json({ error: "Backend not available" }, { status: 500 });
  }

  const teamMembers: Array<{
    uid: string;
    email: string | null;
    role: Role;
    disabled: boolean;
    createdAt: string | null;
    lastSignInAt: string | null;
    authDisplayName: string | null;
  }> = [];

  let pageToken: string | undefined;
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const u of page.users) {
      const role = getRoleFromClaims(
        u.customClaims as Record<string, unknown> | undefined,
      );
      if (!role) continue;
      teamMembers.push({
        uid: u.uid,
        email: u.email ?? null,
        role,
        disabled: u.disabled,
        createdAt: u.metadata.creationTime ?? null,
        lastSignInAt: u.metadata.lastSignInTime ?? null,
        authDisplayName: u.displayName ?? null,
      });
    }
    pageToken = page.pageToken;
  } while (pageToken);

  const profiles: Record<string, { nombre?: string; apellido?: string; telefono?: string | null }> = {};
  if (teamMembers.length > 0) {
    const refs = teamMembers.map((m) => dbAdmin.collection("users").doc(m.uid));
    const docs = await dbAdmin.getAll(...refs);
    for (const doc of docs) {
      if (doc.exists) {
        const data = doc.data() as Record<string, unknown>;
        profiles[doc.id] = {
          nombre: typeof data.nombre === "string" ? data.nombre : undefined,
          apellido: typeof data.apellido === "string" ? data.apellido : undefined,
          telefono: typeof data.telefono === "string" ? data.telefono : null,
        };
      }
    }
  }

  const users: UserListItem[] = teamMembers.map((m) => {
    const p = profiles[m.uid];
    const fallback = (m.authDisplayName ?? "").trim().split(/\s+/);
    const fallbackNombre = fallback[0] ?? null;
    const fallbackApellido = fallback.length > 1 ? fallback.slice(1).join(" ") : null;
    return {
      uid: m.uid,
      email: m.email,
      nombre: p?.nombre ?? fallbackNombre,
      apellido: p?.apellido ?? fallbackApellido,
      telefono: p?.telefono ?? null,
      role: m.role,
      disabled: m.disabled,
      createdAt: m.createdAt,
      lastSignInAt: m.lastSignInAt,
    };
  });

  users.sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const session = await requireSection(request, "usuarios");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!auth || !dbAdmin) {
    return NextResponse.json({ error: "Backend not available" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos invalidos" },
      { status: 400 },
    );
  }
  const { email, password, nombre, apellido, telefono, role } = parsed.data;

  try {
    const existing = await auth.getUserByEmail(email).catch(() => null);
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email" },
        { status: 409 },
      );
    }

    const displayName = `${nombre} ${apellido}`.trim();
    const created = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    });

    await auth.setCustomUserClaims(created.uid, { role });

    await dbAdmin
      .collection("users")
      .doc(created.uid)
      .set({
        uid: created.uid,
        nombre,
        apellido,
        email,
        telefono: telefono ?? null,
        photoURL: null,
        provider: "email",
        role: "customer",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    await writeUserAudit(session, {
      action: "create",
      target: { uid: created.uid, email: created.email ?? email },
      newRole: role,
    });

    return NextResponse.json(
      {
        uid: created.uid,
        email: created.email,
        nombre,
        apellido,
        telefono: telefono ?? null,
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

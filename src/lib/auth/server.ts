import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { auth } from "@/lib/firebase-admin";
import {
  AdminSection,
  Role,
  getRoleFromClaims,
  hasAccess,
} from "./roles";

export interface AdminSessionUser {
  uid: string;
  email: string | null;
  role: Role;
}

async function verify(sessionCookie: string | undefined): Promise<AdminSessionUser | null> {
  if (!sessionCookie || !auth) return null;
  try {
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const role = getRoleFromClaims(decoded as unknown as Record<string, unknown>);
    if (!role) return null;
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      role,
    };
  } catch {
    return null;
  }
}

export async function getAdminSessionFromCookies(): Promise<AdminSessionUser | null> {
  const store = await cookies();
  return verify(store.get("__session")?.value);
}

export async function getAdminSessionFromRequest(
  request: NextRequest,
): Promise<AdminSessionUser | null> {
  return verify(request.cookies.get("__session")?.value);
}

export async function requireRole(
  request: NextRequest,
  allowed: readonly Role[],
): Promise<AdminSessionUser | null> {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return null;
  if (!allowed.includes(session.role)) return null;
  return session;
}

export async function requireSection(
  request: NextRequest,
  section: AdminSection,
): Promise<AdminSessionUser | null> {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return null;
  if (!hasAccess(session.role, section)) return null;
  return session;
}

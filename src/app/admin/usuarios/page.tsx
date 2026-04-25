import { notFound } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/auth/server";
import { hasAccess } from "@/lib/auth/roles";
import UsuariosClient from "@/components/admin/UsuariosClient";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const session = await getAdminSessionFromCookies();
  if (!session || !hasAccess(session.role, "usuarios")) notFound();

  return <UsuariosClient currentUid={session.uid} />;
}

import { notFound } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/auth/server";
import { hasAccess } from "@/lib/auth/roles";

export default async function AuditoriaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSessionFromCookies();
  if (!session || !hasAccess(session.role, "auditoria")) notFound();
  return <>{children}</>;
}

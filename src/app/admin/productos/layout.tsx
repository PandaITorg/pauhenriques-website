import { notFound } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/auth/server";
import { hasAccess } from "@/lib/auth/roles";

export default async function ProductosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSessionFromCookies();
  if (!session || !hasAccess(session.role, "productos")) notFound();
  return <>{children}</>;
}

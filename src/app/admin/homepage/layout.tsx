import { notFound } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/auth/server";
import { hasAccess } from "@/lib/auth/roles";
import HomepageTabs from "@/components/admin/HomepageTabs";

export default async function AdminHomepageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSessionFromCookies();
  if (!session || !hasAccess(session.role, "homepage")) notFound();
  return <HomepageTabs>{children}</HomepageTabs>;
}

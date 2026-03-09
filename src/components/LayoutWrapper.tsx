"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AdminBanner from "@/components/admin/AdminBanner";
import { useLayoutEffect } from "react";

function Wrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useLayoutEffect(() => {
    document.documentElement.scrollTo(0, 0);
  }, [pathname]);
  return <>{children}</>;
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isLinksPage = pathname === "/links";

  if (isLinksPage) {
    return (
      <Wrapper>
        <main>{children}</main>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <AdminBanner />
      <Header />
      <main className={isHomePage ? "bg-tertiary" : "bg-tertiary"}>
        {children}
      </main>
      {!isHomePage && <Footer />}
    </Wrapper>
  );
}

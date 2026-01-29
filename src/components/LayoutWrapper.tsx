"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
      <div className={isHomePage ? "flex flex-col h-screen" : ""}>
        <Header />
        <div
          className={
            isHomePage
              ? "flex-grow overflow-y-auto"
              : "bg-[#a4ac85]"
          }
        >
          <main className={isHomePage ? "h-full bg-[#a4ac85]" : ""}>
            {children}
          </main>
        </div>
        {!isHomePage && <Footer />}
      </div>
    </Wrapper>
  );
}

import { Outlet, useLocation } from "react-router";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import { useLayoutEffect } from "react";

function Wrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  useLayoutEffect(() => {
    document.documentElement.scrollTo(0, 0);
  }, [location.pathname]);
  return children;
}

export default function App() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <Wrapper>
      <div className={isHomePage ? "flex flex-col h-screen" : ""}>
        <ScrollToTop />
        <Header />
        <div
          className={
            isHomePage
              ? "flex-grow overflow-y-auto"
              : "bg-[#a4ac85]"
          }
        >
          <main className={isHomePage ? "h-full bg-[#a4ac85]" : ""}>
            <Outlet />
          </main>
        </div>
        {!isHomePage && <Footer />}
      </div>
    </Wrapper>
  );
}
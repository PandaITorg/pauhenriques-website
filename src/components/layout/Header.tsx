"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

import logo from "@/assets/pauhenriques-lightest-green.png";
import DesktopNav from "@/components/layout/header/DesktopNav";
import MobileMenu from "@/components/layout/header/MobileMenu";
import CartIcon from "@/components/cart/CartIcon";
import { useAuth } from "@/context/AuthContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { href: "/podcast", text: "Podcast" },
    { href: "/tienda", text: "Tienda" },
    { href: "/plan-novios", text: "Plan Novios" },
    { href: "/sobre-mi", text: "Sobre Mi" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const getUserInitial = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    await signOut();
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-bosque-profundo-700/95 backdrop-blur-lg shadow-[0_1px_20px_rgba(6,8,4,0.5)]"
          : "bg-transparent"
      }`}
    >
      {/* Thin gold accent line */}
      <div className="h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />

      <nav className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 flex justify-between items-center h-16 md:h-18">
        {/* Logo */}
        <Link href="/" className="shrink-0 group">
          <Image
            src={logo}
            alt="Pau Henriques"
            className="h-10 md:h-12 w-auto transition-opacity duration-300 group-hover:opacity-80"
            priority
          />
        </Link>

        {/* Desktop nav — centered */}
        <DesktopNav navLinks={navLinks} currentPath={pathname} />

        {/* Right actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <CartIcon />

          {!loading && (
            <>
              {user ? (
                <div className="relative hidden md:block" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-semibold text-sm transition-all duration-300 hover:bg-primary/30 hover:border-primary/50 active:scale-[0.95] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                    aria-label="Menu de usuario"
                    aria-expanded={isDropdownOpen}
                  >
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName || "Avatar"}
                        width={36}
                        height={36}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      getUserInitial()
                    )}
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 top-12 w-56 bg-bosque-profundo-700/95 backdrop-blur-xl border border-border-default rounded-xl py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] animate-[slideUp_0.2s_ease-out]">
                      <div className="px-4 py-3 border-b border-border-subtle">
                        <p className="text-[13px] font-semibold text-text-main truncate">
                          {user.displayName || "Mi cuenta"}
                        </p>
                        <p className="text-[11px] text-text-main/40 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/mi-cuenta"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-text-main/80 hover:text-primary hover:bg-primary/5 active:opacity-80 cursor-pointer transition-colors"
                      >
                        Mi cuenta
                      </Link>
                      <Link
                        href="/mis-pedidos"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-text-main/80 hover:text-primary hover:bg-primary/5 active:opacity-80 cursor-pointer transition-colors"
                      >
                        Mis pedidos
                      </Link>
                      <Link
                        href="/plan-novios/mi-plan"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-text-main/80 hover:text-primary hover:bg-primary/5 active:opacity-80 cursor-pointer transition-colors"
                      >
                        Mi Plan Novios
                      </Link>
                      <div className="h-px bg-border-subtle mx-3 my-1" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-error/80 hover:text-error hover:bg-error/5 active:opacity-80 cursor-pointer transition-colors text-left"
                      >
                        Cerrar sesion
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/sign-in"
                  className="hidden md:inline-flex items-center px-5 py-2 rounded-full text-[13px] font-medium tracking-wide uppercase border border-primary/40 text-primary transition-all duration-300 hover:bg-primary hover:text-bosque-profundo-900 hover:border-primary hover:shadow-(--shadow-glow-primary) active:scale-[0.97] active:opacity-80 cursor-pointer"
                >
                  Ingresar
                </Link>
              )}
            </>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 -mr-1 min-w-11 min-h-11 flex items-center justify-center relative cursor-pointer"
            aria-label={isMenuOpen ? "Cerrar menu" : "Abrir menu"}
          >
            <div className="w-6 h-5 relative flex flex-col justify-between">
              <span
                className={`block h-[1.5px] w-full bg-text-main rounded-full transition-all duration-300 origin-center ${
                  isMenuOpen ? "rotate-45 translate-y-1.75" : ""
                }`}
              />
              <span
                className={`block h-[1.5px] w-full bg-text-main rounded-full transition-all duration-300 ${
                  isMenuOpen ? "opacity-0 scale-x-0" : ""
                }`}
              />
              <span
                className={`block h-[1.5px] w-full bg-text-main rounded-full transition-all duration-300 origin-center ${
                  isMenuOpen ? "-rotate-45 -translate-y-1.75" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      <MobileMenu
        navLinks={navLinks}
        isOpen={isMenuOpen}
        setIsOpen={setIsMenuOpen}
        user={user}
        onSignOut={handleSignOut}
        currentPath={pathname}
      />
    </header>
  );
};

export default Header;

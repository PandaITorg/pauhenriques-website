"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes } from "react-icons/fa";
import Image from "next/image";

import logo from "@/assets/pauhenriques-lightest-green.png";
import DesktopNav from "@/components/layout/header/DesktopNav";
import MobileMenu from "@/components/layout/header/MobileMenu";
import CartIcon from "@/components/cart/CartIcon";
import { useAuth } from "@/context/AuthContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { href: "/podcast", text: "Podcast" },
    { href: "/tienda", text: "Tienda" },
    { href: "/sobre-mi", text: "Sobre Mi" },
    { href: "/programa-afiliados", text: "Afiliados" },
  ];

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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

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
    <header className="bg-background/95 backdrop-blur-md shadow-md sticky top-0 z-50 border-b border-border-subtle">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center h-16 md:h-20">
        <Link href="/" className="shrink-0">
          <Image
            src={logo}
            alt="Pau Henriques Logo"
            className="h-11 md:h-14 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-3 md:gap-5">
          <DesktopNav navLinks={navLinks} currentPath={pathname} />

          <CartIcon />

          {!loading && (
            <>
              {user ? (
                <div className="relative hidden md:block" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm transition-all duration-200 hover:bg-[#b89a73] hover:shadow-[0_0_0_3px_rgba(166,138,99,0.3)] focus:outline-none"
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
                    <div className="absolute right-0 top-11 w-52 bg-input-bg border border-border-default rounded-xl py-2 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                      <div className="px-4 py-2 border-b border-border-subtle">
                        <p className="text-[13px] font-semibold text-text-main truncate">
                          {user.displayName || "Mi cuenta"}
                        </p>
                        <p className="text-[11px] text-[rgba(193,196,167,0.5)] truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/mi-cuenta"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-text-main hover:bg-[rgba(193,196,167,0.08)] transition-colors"
                      >
                        Mi cuenta
                      </Link>
                      <Link
                        href="/mis-pedidos"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-text-main hover:bg-[rgba(193,196,167,0.08)] transition-colors"
                      >
                        Mis pedidos
                      </Link>
                      <div className="h-px bg-border-subtle my-1" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-[14px] text-red-400 hover:bg-[rgba(229,115,115,0.08)] transition-colors text-left"
                      >
                        Cerrar sesion
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/sign-in"
                  className="hidden md:flex items-center px-5 py-2 border-[1.5px] border-primary rounded-lg text-primary text-[14px] font-medium transition-all duration-200 hover:bg-primary hover:text-white"
                >
                  Ingresar
                </Link>
              )}
            </>
          )}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 -mr-2 min-w-11 min-h-11 flex items-center justify-center"
            aria-label={isMenuOpen ? "Cerrar menu" : "Abrir menu"}
          >
            {isMenuOpen ? (
              <FaTimes className="text-text-main h-6 w-6" />
            ) : (
              <FaBars className="text-text-main h-6 w-6" />
            )}
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

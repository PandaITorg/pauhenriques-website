"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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

  const navLinks = [
    { href: "/podcast", text: "Podcast" },
    { href: "/tienda", text: "Tienda" },
    { href: "/sobre-mi", text: "Sobre Mí" },
    { href: "/programa-afiliados", text: "Afiliados" },
  ];

  // Cerrar dropdown al hacer click fuera
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

  // Obtener inicial del nombre del usuario
  const getUserInitial = () => {
    if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    await signOut();
  };

  return (
    <header className="bg-background shadow-md h-20 sticky top-0 z-[51]">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logotipo del sitio */}
        <div className="flex items-center">
          <Link href="/">
            <Image
              src={logo}
              alt="Pau Henriques Logo"
              className="h-16 w-auto"
              priority
            />
          </Link>
        </div>

        {/* Contenedor para los elementos de la derecha */}
        <div className="flex items-center space-x-5">
          {/* Navegación para pantallas de escritorio */}
          <DesktopNav navLinks={navLinks} />

          {/* Ícono del Carrito */}
          <CartIcon />

          {/* Estado de autenticación */}
          {!loading && (
            <>
              {user ? (
                /* Usuario autenticado: Avatar + Dropdown */
                <div className="relative hidden md:block" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm transition-all duration-200 hover:bg-[#b89a73] hover:shadow-[0_0_0_3px_rgba(166,138,99,0.3)] focus:outline-none"
                    aria-label="Menú de usuario"
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

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-11 w-52 bg-input-bg border border-[rgba(193,196,167,0.2)] rounded-xl py-2 shadow-[0_8px_24px_rgba(0,0,0,0.4)] z-50">
                      {/* User info */}
                      <div className="px-4 py-2 border-b border-[rgba(193,196,167,0.12)]">
                        <p className="text-[13px] font-semibold text-text-main truncate">
                          {user.displayName || "Mi cuenta"}
                        </p>
                        <p className="text-[11px] text-[rgba(193,196,167,0.5)] truncate">
                          {user.email}
                        </p>
                      </div>

                      {/* Links */}
                      <Link
                        href="/mi-cuenta"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-text-main hover:bg-[rgba(193,196,167,0.08)] transition-colors"
                      >
                        <span>👤</span> Mi cuenta
                      </Link>
                      <Link
                        href="/mis-pedidos"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-text-main hover:bg-[rgba(193,196,167,0.08)] transition-colors"
                      >
                        <span>📦</span> Mis pedidos
                      </Link>

                      <div className="h-px bg-[rgba(193,196,167,0.12)] my-1" />

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-[14px] text-red-400 hover:bg-[rgba(229,115,115,0.08)] transition-colors text-left"
                      >
                        <span>🚪</span> Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Usuario no autenticado: Botón Ingresar */
                <Link
                  href="/sign-in"
                  className="hidden md:flex items-center px-5 py-2 border-[1.5px] border-primary rounded-lg text-primary text-[14px] font-medium transition-all duration-200 hover:bg-primary hover:text-white"
                >
                  Ingresar
                </Link>
              )}
            </>
          )}

          {/* Botón para abrir/cerrar el menú móvil */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? (
                <FaTimes className="text-text-main h-6 w-6" />
              ) : (
                <FaBars className="text-text-main h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Menú para pantallas móviles */}
      <MobileMenu
        navLinks={navLinks}
        isOpen={isMenuOpen}
        setIsOpen={setIsMenuOpen}
        user={user}
        onSignOut={handleSignOut}
      />
    </header>
  );
};

export default Header;

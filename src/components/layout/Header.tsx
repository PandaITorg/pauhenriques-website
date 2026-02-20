"use client";

import { useState } from "react";
import Link from "next/link";
import { FaBars, FaTimes } from "react-icons/fa";
import Image from "next/image";

// Importaciones usando el alias de ruta "@/" para máxima robustez
import logo from "@/assets/pauhenriques-lightest-green.png";
import DesktopNav from "@/components/layout/header/DesktopNav";
import MobileMenu from "@/components/layout/header/MobileMenu";
import CartIcon from "@/components/cart/CartIcon"; // Importación corregida

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "/podcast", text: "Podcast" },
    { href: "/tienda", text: "Tienda" },
    { href: "/sobre-mi", text: "Sobre Mí" },
    { href: "/programa-afiliados", text: "Afiliados" },
  ];

  return (
    <header className="bg-background shadow-md h-20 sticky top-0 z-[51]">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logotipo del sitio */}
        <div className="flex items-center">
          <Link href="/">
            <Image src={logo} alt="Pau Henriques Logo" className="h-16 w-auto" priority />
          </Link>
        </div>

        {/* Contenedor para los elementos de la derecha */}
        <div className="flex items-center space-x-5">
          {/* Navegación para pantallas de escritorio */}
          <DesktopNav navLinks={navLinks} />

          {/* Ícono del Carrito (Visible en todas las pantallas) */}
          <CartIcon />

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
      />
    </header>
  );
};

export default Header;

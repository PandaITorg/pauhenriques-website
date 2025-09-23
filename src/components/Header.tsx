import { useState } from "react";
import { Link } from "react-router";
import logo from "../assets/pauhenriques-lightest-green.png";
import { FaBars, FaTimes } from "react-icons/fa";
import DesktopNav from "./header/DesktopNav";
import MobileMenu from "./header/MobileMenu";

// Este componente representa la barra de navegación principal de la aplicación.
const Header = () => {
  // Estado para controlar si el menú móvil está abierto o cerrado.
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Lista de enlaces de navegación.
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
        <div>
          <Link to="/">
            <img src={logo} alt="Pau Henriques Logo" className="h-16" />
          </Link>
        </div>

        {/* Navegación para pantallas de escritorio */}
        <DesktopNav navLinks={navLinks} />

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
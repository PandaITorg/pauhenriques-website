import { useState } from 'react';
import { Link } from 'react-router';
import logo from '../assets/pauhenriques-lightest-green.png';
import { FaWhatsapp, FaBars, FaTimes } from 'react-icons/fa';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: '/podcast', text: 'Podcast' },
    { href: '/tienda', text: 'Tienda' },
    { href: '/sobre-mi', text: 'Sobre Mí' },
  ];

  return (
        <header className="bg-background shadow-md h-20 sticky top-0 z-[51]">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <div>
          <Link to="/">
            <img src={logo} alt="Pau Henriques Logo" className="h-16" />
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <ul className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className="text-text-main transform transition-all duration-300 hover:text-primary hover:scale-105"
              >
                {link.text}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA for Desktop */}
        <div className="hidden md:flex">
          <a
            href="https://wa.me/593991712532"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-white px-6 py-2 rounded-full flex items-center space-x-2 transform transition-all duration-300 hover:scale-105"
          >
            <span>Contáctame</span>
            <FaWhatsapp />
          </a>
        </div>

        {/* Mobile Menu Button */}
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

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background shadow-lg absolute top-20 left-0 w-full">
          <ul className="flex flex-col items-center space-y-4 py-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="text-text-main transform transition-all duration-300 hover:text-primary hover:scale-105"
                  onClick={() => setIsMenuOpen(false)} // Close menu on click
                >
                  {link.text}
                </Link>
              </li>
            ))}
            <li>
              <a
                href="https://wa.me/593991712532"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-white px-6 py-2 rounded-full flex items-center space-x-2 transform transition-all duration-300 hover:scale-105"
              >
                <span>Contáctame</span>
                <FaWhatsapp />
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
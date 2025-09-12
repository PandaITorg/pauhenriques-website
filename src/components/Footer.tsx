import { Link } from "react-router";
import { FaInstagram, FaWhatsapp, FaTiktok } from "react-icons/fa";
import logo from "../assets/pauhenriques-lightest-green.png";
import PandaITLogo from "../assets/PandaIT-imagotipo-horizontal.svg";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      href: "https://www.instagram.com/pau_henriques/",
      icon: FaInstagram,
      ariaLabel: "Instagram",
    },
    {
      href: "https://wa.me/593991712532",
      icon: FaWhatsapp,
      ariaLabel: "WhatsApp",
    },
    {
      href: "https://www.tiktok.com/@pau_henriques",
      icon: FaTiktok,
      ariaLabel: "TikTok",
    },
  ];

  return (
    <footer className="bg-background text-text-main">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Logo and Tagline */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
            <Link to="/" className="mb-4">
              <img src={logo} alt="Pau Henriques Logo" className="h-14" />
            </Link>
            <p className="text-sm">Vive sin tóxicos, vive plenamente.</p>
          </div>

          {/* Navigation */}
          <div className="md:col-span-2 text-center md:text-left">
            <h3 className="text-md font-semibold tracking-wider uppercase mb-4">
              Navegación
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  to="/tienda"
                  className="hover:text-primary transition-colors"
                >
                  Tienda
                </Link>
              </li>
              <li>
                <Link
                  to="/podcast"
                  className="hover:text-primary transition-colors"
                >
                  Podcast
                </Link>
              </li>
              <li>
                <Link
                  to="/sobre-mi"
                  className="hover:text-primary transition-colors"
                >
                  Sobre Mí
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-3 text-center md:text-left">
            <h3 className="text-md font-semibold tracking-wider uppercase mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/politica-privacidad"
                  className="hover:text-primary transition-colors"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  to="/terminos-servicio"
                  className="hover:text-primary transition-colors"
                >
                  Términos de Servicio
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="md:col-span-3 flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-md font-semibold tracking-wider uppercase mb-4">
              Conéctate
            </h3>
            <div className="flex space-x-5">
              {socialLinks.map((social) => (
                <a
                  key={social.ariaLabel}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.ariaLabel}
                  className="text-text-main hover:text-primary transition-transform duration-300 hover:scale-110"
                >
                  <social.icon className="h-7 w-7" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-color-input-bg flex flex-col sm:flex-row justify-between items-center text-sm text-text-secondary">
          <p className="mb-4 sm:mb-0">
            &copy; {currentYear} Pau Henriques. Todos los derechos reservados.
          </p>
          <div className="flex items-center">
            <span className="mr-2">Desarrollado por</span>
            <a
              href="https://www.pandait.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img src={PandaITLogo} alt="Panda IT Logo" className="h-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

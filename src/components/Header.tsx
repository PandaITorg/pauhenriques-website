import logo from '../assets/pauhenriques-lightest-green.png';

export default function Header() {
  return (
    <header className="bg-background shadow-md h-20">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <div>
          <a href="/">
            <img src={logo} alt="Pau Henriques Logo" className="h-16" />
          </a>
        </div>

        {/* Navigation Links */}
        <ul className="flex items-center space-x-6">
          <li>
            <a href="/" className="text-text-main transform transition-all duration-300 hover:text-primary hover:scale-105">
              Inicio
            </a>
          </li>
          <li>
            <a href="/productos" className="text-text-main transform transition-all duration-300 hover:text-primary hover:scale-105">
              Productos
            </a>
          </li>
          <li>
            <a href="/contacto" className="text-text-main transform transition-all duration-300 hover:text-primary hover:scale-105">
              Contacto
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

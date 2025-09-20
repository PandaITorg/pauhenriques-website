import { Link } from "react-router";

const Nav = () => {
  return (
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
  );
};

export default Nav;

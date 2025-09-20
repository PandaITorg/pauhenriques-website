import { Link } from "react-router";

const Legal = () => {
  return (
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
  );
};

export default Legal;

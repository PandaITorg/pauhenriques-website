import Link from "next/link";

const Legal = () => {
  return (
    <div className="col-span-1 md:col-span-3 text-left">
      <h3 className="text-sm font-semibold tracking-wider uppercase mb-3 md:mb-4">
        Legal
      </h3>
      <ul className="space-y-2 md:space-y-3 text-sm md:text-base">
        <li>
          <Link
            href="/politica-privacidad"
            className="hover:text-primary transition-colors"
          >
            Política de Privacidad
          </Link>
        </li>
        <li>
          <Link
            href="/terminos-servicio"
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

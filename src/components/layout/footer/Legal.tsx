import Link from "next/link";

const Legal = () => {
  return (
    <div className="md:col-span-2 text-center md:text-left">
      <h3 className="text-[11px] font-medium tracking-[0.15em] uppercase text-primary/60 mb-4">
        Legal
      </h3>
      <ul className="space-y-2.5">
        <li>
          <Link
            href="/politica-privacidad"
            className="text-sm text-text-main/50 hover:text-primary active:opacity-80 cursor-pointer transition-colors duration-300"
          >
            Privacidad
          </Link>
        </li>
        <li>
          <Link
            href="/terminos-servicio"
            className="text-sm text-text-main/50 hover:text-primary active:opacity-80 cursor-pointer transition-colors duration-300"
          >
            Terminos
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Legal;

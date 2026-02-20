import Link from "next/link";

const Nav = () => {
  return (
    <div className="md:col-span-2 text-center md:text-left">
      <h3 className="text-md font-semibold tracking-wider uppercase mb-4">
        Navegación
      </h3>
      <ul className="space-y-3">
        <li>
          <Link href="/" className="hover:text-primary transition-colors">
            Inicio
          </Link>
        </li>
        <li>
          <Link
            href="/tienda"
            className="hover:text-primary transition-colors"
          >
            Tienda
          </Link>
        </li>
        <li>
          <Link
            href="/podcast"
            className="hover:text-primary transition-colors"
          >
            Podcast
          </Link>
        </li>
        <li>
          <Link
            href="/sobre-mi"
            className="hover:text-primary transition-colors"
          >
            Sobre Mí
          </Link>
        </li>
        <li>
          <Link
            href="/programa-afiliados"
            className="hover:text-primary transition-colors"
          >
            Afiliados
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Nav;

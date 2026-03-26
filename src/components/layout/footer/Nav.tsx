import Link from "next/link";

const Nav = () => {
  const links = [
    { href: "/", text: "Inicio" },
    { href: "/tienda", text: "Tienda" },
    { href: "/podcast", text: "Podcast" },
    { href: "/sobre-mi", text: "Sobre Mi" },
  ];

  return (
    <div className="md:col-span-3 text-center md:text-left">
      <h3 className="text-[11px] font-medium tracking-[0.15em] uppercase text-primary/60 mb-4">
        Navegacion
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-text-main/50 hover:text-primary active:opacity-80 cursor-pointer transition-colors duration-300"
            >
              {link.text}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Nav;

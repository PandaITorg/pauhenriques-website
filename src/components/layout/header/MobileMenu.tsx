import Link from "next/link";
import { User } from "firebase/auth";

interface NavLink {
  href: string;
  text: string;
}

interface MobileMenuProps {
  navLinks: NavLink[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user?: User | null;
  onSignOut?: () => Promise<void>;
  currentPath: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  navLinks,
  isOpen,
  setIsOpen,
  user,
  onSignOut,
  currentPath,
}) => {
  return (
    <div
      className={`md:hidden fixed inset-0 top-16.25 z-40 transition-all duration-400 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-bosque-profundo-900/80 backdrop-blur-sm transition-opacity duration-400 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Menu panel */}
      <div
        className={`relative bg-bosque-profundo-800/95 backdrop-blur-xl border-t border-primary/10 h-full overflow-y-auto transition-transform duration-400 ease-out ${
          isOpen ? "translate-y-0" : "-translate-y-4"
        }`}
      >
        <div className="max-w-lg mx-auto px-6 py-8 flex flex-col gap-1">
          {/* Nav links */}
          {navLinks.map((link, i) => {
            const isActive = currentPath === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group flex items-center gap-4 py-4 transition-all duration-300 ${
                  isOpen
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-4"
                }`}
                style={{
                  transitionDelay: isOpen ? `${(i + 1) * 75}ms` : "0ms",
                }}
                onClick={() => setIsOpen(false)}
              >
                <span
                  className={`h-px transition-all duration-300 ${
                    isActive
                      ? "w-8 bg-primary"
                      : "w-4 bg-text-main/20 group-active:w-8 group-active:bg-primary"
                  }`}
                />
                <span
                  className={`font-cormorant text-2xl tracking-wide transition-colors duration-300 ${
                    isActive
                      ? "text-primary"
                      : "text-text-main/80 group-active:text-primary"
                  }`}
                >
                  {link.text}
                </span>
              </Link>
            );
          })}

          {/* Separator */}
          <div className="h-px bg-linear-to-r from-primary/20 via-primary/10 to-transparent my-4" />

          {/* User section */}
          {user ? (
            <div
              className={`transition-all duration-300 ${
                isOpen
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-4"
              }`}
              style={{
                transitionDelay: isOpen
                  ? `${(navLinks.length + 1) * 75}ms`
                  : "0ms",
              }}
            >
              <div className="flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                  {user.displayName?.charAt(0).toUpperCase() ||
                    user.email?.charAt(0).toUpperCase() ||
                    "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-main truncate">
                    {user.displayName || "Mi cuenta"}
                  </p>
                  <p className="text-xs text-text-main/40 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <Link
                href="/mi-cuenta"
                className="flex items-center gap-4 py-3.5 text-text-main/70 active:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span className="h-px w-4 bg-text-main/10" />
                <span className="text-base">Mi cuenta</span>
              </Link>
              <Link
                href="/mis-pedidos"
                className="flex items-center gap-4 py-3.5 text-text-main/70 active:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span className="h-px w-4 bg-text-main/10" />
                <span className="text-base">Mis pedidos</span>
              </Link>
              <button
                onClick={async () => {
                  setIsOpen(false);
                  await onSignOut?.();
                }}
                className="flex items-center gap-4 py-3.5 text-error/70 active:text-error transition-colors w-full text-left"
              >
                <span className="h-px w-4 bg-error/20" />
                <span className="text-base">Cerrar sesion</span>
              </button>
            </div>
          ) : (
            <div
              className={`mt-2 transition-all duration-300 ${
                isOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={{
                transitionDelay: isOpen
                  ? `${(navLinks.length + 1) * 75}ms`
                  : "0ms",
              }}
            >
              <Link
                href="/sign-in"
                className="flex items-center justify-center py-3.5 rounded-full border border-primary/40 text-primary text-[14px] font-medium tracking-wide uppercase transition-all duration-300 active:bg-primary active:text-bosque-profundo-900 active:border-primary"
                onClick={() => setIsOpen(false)}
              >
                Ingresar
              </Link>
            </div>
          )}

          {/* Bottom tagline */}
          <p className="mt-auto pt-8 text-center text-xs text-text-main/25 font-cormorant italic tracking-wider">
            Vive sin toxicos, vive plenamente
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;

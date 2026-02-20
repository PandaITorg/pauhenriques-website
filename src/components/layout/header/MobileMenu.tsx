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
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  navLinks,
  isOpen,
  setIsOpen,
  user,
  onSignOut,
}) => {
  if (!isOpen) return null;

  return (
    <div className="md:hidden absolute top-20 left-0 w-full bg-background shadow-lg z-50">
      <div className="container mx-auto px-4 py-5 flex flex-col space-y-4">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-text-main hover:text-[#5a6b4a] transition-colors text-lg"
            onClick={() => setIsOpen(false)}
          >
            {link.text}
          </Link>
        ))}

        {/* Separador */}
        <div className="h-px bg-[rgba(193,196,167,0.15)]" />

        {/* Estado de autenticación en móvil */}
        {user ? (
          <>
            <div className="flex items-center gap-3 py-1">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user.displayName?.charAt(0).toUpperCase() ||
                  user.email?.charAt(0).toUpperCase() ||
                  "U"}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-text-main">
                  {user.displayName || "Mi cuenta"}
                </p>
                <p className="text-[11px] text-[rgba(193,196,167,0.5)]">
                  {user.email}
                </p>
              </div>
            </div>
            <Link
              href="/mi-cuenta"
              className="text-text-main hover:text-[#5a6b4a] transition-colors text-base flex items-center gap-2"
              onClick={() => setIsOpen(false)}
            >
              <span>👤</span> Mi cuenta
            </Link>
            <Link
              href="/mis-pedidos"
              className="text-text-main hover:text-[#5a6b4a] transition-colors text-base flex items-center gap-2"
              onClick={() => setIsOpen(false)}
            >
              <span>📦</span> Mis pedidos
            </Link>
            <button
              onClick={async () => {
                setIsOpen(false);
                await onSignOut?.();
              }}
              className="text-red-400 hover:text-red-300 transition-colors text-base flex items-center gap-2 text-left"
            >
              <span>🚪</span> Cerrar sesión
            </button>
          </>
        ) : (
          <Link
            href="/sign-in"
            className="flex items-center justify-center px-5 py-2.5 border-[1.5px] border-primary rounded-lg text-primary text-[14px] font-medium transition-all duration-200 hover:bg-primary hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            Ingresar
          </Link>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;

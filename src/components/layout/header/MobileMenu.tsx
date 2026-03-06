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
      className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-background ${
        isOpen ? "max-h-[80vh] opacity-100 border-t border-text-main/10" : "max-h-0 opacity-0"
      }`}
    >
      <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
        {navLinks.map((link) => {
          const isActive = currentPath === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`py-3 px-4 rounded-lg text-lg font-medium transition-colors ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-text-main active:bg-primary/5"
              }`}
              onClick={() => setIsOpen(false)}
            >
              {link.text}
            </Link>
          );
        })}

        <div className="h-px bg-text-main/15 my-2" />

        {user ? (
          <>
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user.displayName?.charAt(0).toUpperCase() ||
                  user.email?.charAt(0).toUpperCase() ||
                  "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-main truncate">
                  {user.displayName || "Mi cuenta"}
                </p>
                <p className="text-xs text-text-main/50 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Link
              href="/mi-cuenta"
              className="py-3 px-4 rounded-lg text-text-main active:bg-primary/5 transition-colors text-base"
              onClick={() => setIsOpen(false)}
            >
              Mi cuenta
            </Link>
            <Link
              href="/mis-pedidos"
              className="py-3 px-4 rounded-lg text-text-main active:bg-primary/5 transition-colors text-base"
              onClick={() => setIsOpen(false)}
            >
              Mis pedidos
            </Link>
            <button
              onClick={async () => {
                setIsOpen(false);
                await onSignOut?.();
              }}
              className="py-3 px-4 rounded-lg text-red-400 active:bg-red-400/5 transition-colors text-base text-left"
            >
              Cerrar sesion
            </button>
          </>
        ) : (
          <Link
            href="/sign-in"
            className="flex items-center justify-center mx-4 mt-2 py-3 border-[1.5px] border-primary rounded-lg text-primary text-base font-medium transition-all duration-200 active:bg-primary active:text-white"
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

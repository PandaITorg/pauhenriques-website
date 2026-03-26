import Link from "next/link";

interface NavLink {
  href: string;
  text: string;
}

interface DesktopNavProps {
  navLinks: NavLink[];
  currentPath: string;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ navLinks, currentPath }) => {
  return (
    <div className="hidden md:flex items-center gap-1">
      {navLinks.map((link) => {
        const isActive = currentPath === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative px-4 py-2 text-[13px] font-medium tracking-[0.08em] uppercase transition-all duration-300 cursor-pointer ${
              isActive
                ? "text-primary"
                : "text-text-main/70 hover:text-primary active:scale-[0.97] active:opacity-80"
            }`}
          >
            {link.text}
            {/* Active indicator — subtle gold dot */}
            {isActive && (
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default DesktopNav;

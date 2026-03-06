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
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "text-primary bg-primary/10"
                : "text-text-main hover:text-primary hover:bg-primary/5"
            }`}
          >
            {link.text}
          </Link>
        );
      })}
    </div>
  );
};

export default DesktopNav;

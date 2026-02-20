import Link from "next/link";

interface NavLink {
  href: string;
  text: string;
}

interface DesktopNavProps {
  navLinks: NavLink[];
}

const DesktopNav: React.FC<DesktopNavProps> = ({ navLinks }) => {
  return (
    <div className="hidden md:flex items-center space-x-5">
      {navLinks.map((link) => (
        <Link key={link.href} href={link.href} className="text-text-main hover:text-[#5a6b4a] transition-colors">
          {link.text}
        </Link>
      ))}
    </div>
  );
};

export default DesktopNav;

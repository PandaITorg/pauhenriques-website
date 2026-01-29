import Link from "next/link";
import CTAButton from "./CTAButton";

interface NavLink {
  href: string;
  text: string;
}

interface DesktopNavProps {
  navLinks: NavLink[];
}

const DesktopNav = ({ navLinks }: DesktopNavProps) => {
  return (
    <>
      <ul className="hidden md:flex items-center space-x-6">
        {navLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-text-main transform transition-all duration-300 hover:text-primary hover:scale-105"
            >
              {link.text}
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden md:flex">
        <CTAButton />
      </div>
    </>
  );
};

export default DesktopNav;

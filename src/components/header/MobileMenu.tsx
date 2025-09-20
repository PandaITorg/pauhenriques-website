import { Link } from "react-router";
import CTAButton from "./CTAButton";

interface NavLink {
  href: string;
  text: string;
}

interface MobileMenuProps {
  navLinks: NavLink[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const MobileMenu = ({ navLinks, isOpen, setIsOpen }: MobileMenuProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="md:hidden bg-background shadow-lg absolute top-20 left-0 w-full">
      <ul className="flex flex-col items-center space-y-4 py-4">
        {navLinks.map((link) => (
          <li key={link.href}>
            <Link
              to={link.href}
              className="text-text-main transform transition-all duration-300 hover:text-primary hover:scale-105"
              onClick={() => setIsOpen(false)}
            >
              {link.text}
            </Link>
          </li>
        ))}
        <li>
          <CTAButton />
        </li>
      </ul>
    </div>
  );
};

export default MobileMenu;

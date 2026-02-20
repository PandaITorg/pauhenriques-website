import Link from "next/link";

interface NavLink {
  href: string;
  text: string;
}

interface MobileMenuProps {
  navLinks: NavLink[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ navLinks, isOpen, setIsOpen }) => {
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
      </div>
    </div>
  );
};

export default MobileMenu;

import { FaWhatsapp } from "react-icons/fa";

const CTAButton = () => {
  return (
    <a
      href="https://wa.me/593991712532"
      target="_blank"
      rel="noopener noreferrer"
      className="bg-primary text-white px-6 py-2 rounded-full flex items-center space-x-2 transform transition-all duration-300 hover:scale-105"
    >
      <span>Contáctame</span>
      <FaWhatsapp />
    </a>
  );
};

export default CTAButton;

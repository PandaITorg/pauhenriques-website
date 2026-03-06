import { FaInstagram, FaWhatsapp, FaTiktok } from "react-icons/fa";

const Social = () => {
  const socialLinks = [
    {
      href: "https://www.instagram.com/pau_henriques/",
      icon: FaInstagram,
      ariaLabel: "Instagram",
    },
    {
      href: "https://wa.me/593991712532",
      icon: FaWhatsapp,
      ariaLabel: "WhatsApp",
    },
    {
      href: "https://www.tiktok.com/@pau_henriques",
      icon: FaTiktok,
      ariaLabel: "TikTok",
    },
  ];

  return (
    <div className="col-span-2 md:col-span-3 flex flex-col items-center md:items-start text-center md:text-left">
      <h3 className="text-sm font-semibold tracking-wider uppercase mb-3 md:mb-4">
        Conectate
      </h3>
      <div className="flex gap-5">
        {socialLinks.map((social) => (
          <a
            key={social.ariaLabel}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.ariaLabel}
            className="text-text-main hover:text-primary transition-transform duration-300 hover:scale-110"
          >
            <social.icon className="h-7 w-7" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default Social;

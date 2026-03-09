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
    <div className="md:col-span-3 flex flex-col items-center md:items-start text-center md:text-left">
      <h3 className="text-[11px] font-medium tracking-[0.15em] uppercase text-primary/60 mb-4">
        Conectate
      </h3>
      <div className="flex gap-4">
        {socialLinks.map((social) => (
          <a
            key={social.ariaLabel}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.ariaLabel}
            className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center text-text-main/50 transition-all duration-300 hover:border-primary/40 hover:text-primary hover:shadow-(--shadow-glow-primary)"
          >
            <social.icon className="h-4.5 w-4.5" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default Social;

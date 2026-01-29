import { FaTiktok, FaWhatsapp, FaInstagram } from "react-icons/fa";
import PauNoBg from "@/assets/pau-no-bg.webp";
import PauHenriquesLightestGreen from "@/assets/pauhenriques-lightest-green.png";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Pau Henriques | Links",
  description: "Enlaces de contacto y redes sociales de Pau Henriques.",
};

const whatsappLinks = [
  {
    text: "Acero Quirurgico 3 - 16",
    href: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20%22Acero%20Quirurgico%22,%20soy:%20%20",
  },
  {
    text: "Purificadores de Agua",
    href: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20el%20purificador%20de%20agua,%20soy:%20%20",
  },
  {
    text: "Purificadores de Aire",
    href: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20los%20purificadores%20de%20aire,%20soy:%20%20",
  },
  {
    text: "Descanso con tecnologia Earthing",
    href: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20el%20descanso%20con%20tecnolog%C3%ADa%20earthing%20,%20soy:%20%20",
  },
  {
    text: "Clean Machine",
    href: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20la%20clean%20machine,%20soy:%20%20",
  },
  {
    text: "Línea de chuchillo de acero quirurjico",
    href: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20la%l%C3%ADnea%de%cuchillos%de%acero%Quirurgico,%20soy:%20%20",
  },
  {
    text: "El Juicer",
    href: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20el%20juicer,%20soy:%20%20",
  },
];

const socialLinks = [
  {
    href: "https://www.instagram.com/pau_henriques/",
    icon: FaInstagram,
    ariaLabel: "Instagram",
  },
  {
    href: "https://www.tiktok.com/@pau_henriques",
    icon: FaTiktok,
    ariaLabel: "TikTok",
  },
  {
    href: "https://wa.me/593991712532",
    icon: FaWhatsapp,
    ariaLabel: "WhatsApp",
  },
];

export default function LinkInBioPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 animated-linear-gradient-links text-text-main">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <Image
          src={PauHenriquesLightestGreen}
          alt="Pau Henriques Logo"
          width={300}
          height={100}
          className="max-w-[80%] h-auto mx-auto mb-8"
        />
        {/* Profile Picture */}
        <div className="relative w-40 h-40 mx-auto mb-4 bg-tertiary rounded-full flex items-center justify-center border-4 border-primary shadow-lg overflow-hidden">
          <Image
            src={PauNoBg}
            alt="Pau Henriques"
            fill
            className="object-cover relative z-10"
          />
        </div>

        {/* Social Icons */}
        <div className="flex justify-center gap-6 mb-8">
          {socialLinks.map((link) => (
            <a
              key={link.ariaLabel}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.ariaLabel}
              className="text-text-main hover:text-primary transition-transform duration-300 hover:scale-125"
            >
              <link.icon className="h-8 w-8" />
            </a>
          ))}
        </div>

        {/* Introductory Text */}
        <p className="text-lg text-text-secondary leading-relaxed mb-8">
          ¡Hola! Si quieres más información sobre mis productos, haz clic en los
          siguientes enlaces para chatear conmigo.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-4 mb-8">
          {whatsappLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-white font-bold py-3 px-8 rounded-full block transition-all duration-300 ease-in-out hover:brightness-110 hover:scale-105 active:scale-95 transform"
            >
              {link.text}
            </a>
          ))}
        </div>

        {/* Additional Links */}
        <div className="flex flex-col gap-4">
          <a
            href="https://pauhenriques.com"
            className="bg-secondary text-text-dark font-bold py-3 px-8 rounded-full block transition-all duration-300 ease-in-out hover:brightness-110 hover:scale-105 active:scale-95 transform"
          >
            Visita mi sitio web
          </a>
        </div>
      </div>
    </div>
  );
}

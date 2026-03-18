import { FaTiktok, FaWhatsapp, FaInstagram } from "react-icons/fa";
import { HiOutlineShoppingBag } from "react-icons/hi2";
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
    <div className="min-h-screen bg-background flex flex-col items-center p-5 pt-10 pb-16 relative overflow-hidden">
      {/* Subtle warm gradient at top */}
      <div className="absolute inset-0 bg-linear-to-b from-warm-950/50 via-background to-background pointer-events-none" />

      {/* Ambient glow behind profile */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Logo */}
        <Image
          src={PauHenriquesLightestGreen}
          alt="Pau Henriques Logo"
          width={260}
          height={86}
          className="max-w-[70%] h-auto mx-auto mb-8"
        />

        {/* Profile Picture with glow ring */}
        <div className="relative w-36 h-36 mx-auto mb-2">
          <div className="absolute -inset-1 rounded-full bg-linear-to-br from-primary/40 to-primary/10 blur-sm" />
          <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-primary/30 bg-surface-card">
            <Image
              src={PauNoBg}
              alt="Pau Henriques"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Name & tagline */}
        <h1 className="font-cormorant text-2xl font-semibold text-text-main mb-1">
          Pau Henriques
        </h1>
        <p className="text-sm text-text-main/50 mb-6">
          Coach de vida sin toxicos
        </p>

        {/* Social Icons */}
        <div className="flex justify-center gap-5 mb-8">
          {socialLinks.map((link) => (
            <a
              key={link.ariaLabel}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.ariaLabel}
              className="w-11 h-11 rounded-xl bg-surface-card border border-border-subtle flex items-center justify-center text-text-main/60 hover:text-primary hover:border-primary/30 hover:shadow-(--shadow-glow-primary) transition-all duration-200"
            >
              <link.icon className="h-5 w-5" />
            </a>
          ))}
        </div>

        {/* Separator */}
        <div className="h-px bg-linear-to-r from-transparent via-border-default to-transparent mb-8" />

        {/* Intro text */}
        <p className="text-sm text-text-main/60 leading-relaxed mb-6">
          Quieres mas informacion sobre mis productos? Haz clic para chatear
          conmigo por WhatsApp.
        </p>

        {/* WhatsApp product links */}
        <div className="flex flex-col gap-3 mb-8">
          {whatsappLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 bg-surface-card border border-border-subtle rounded-xl py-3.5 px-5 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-(--shadow-glow-primary) hover:-translate-y-px active:scale-[0.98]"
            >
              <span className="w-8 h-8 rounded-lg bg-whatsapp/15 flex items-center justify-center shrink-0">
                <FaWhatsapp className="w-4 h-4 text-whatsapp" />
              </span>
              <span className="text-sm font-medium text-text-main group-hover:text-primary transition-colors">
                {link.text}
              </span>
            </a>
          ))}
        </div>

        {/* Separator */}
        <div className="h-px bg-linear-to-r from-transparent via-border-default to-transparent mb-8" />

        {/* Site & shop links */}
        <div className="flex flex-col gap-3">
          <a
            href="https://pauhenriques.com/tienda"
            className="bg-primary hover:bg-primary-hover text-white font-semibold py-3.5 px-8 rounded-xl transition-all duration-200 hover:-translate-y-px hover:shadow-(--shadow-glow-primary) active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <HiOutlineShoppingBag className="w-5 h-5" />
            Ir a mi Tienda
          </a>
          <a
            href="https://pauhenriques.com"
            className="border border-border-default text-text-main/60 font-semibold py-3.5 px-8 rounded-xl block transition-all duration-200 hover:bg-surface-elevated hover:text-text-main active:scale-[0.98]"
          >
            Visita mi sitio web
          </a>
        </div>

        {/* Footer branding */}
        <p className="mt-10 text-xs text-text-main/25">
          pauhenriques.com
        </p>
      </div>
    </div>
  );
}

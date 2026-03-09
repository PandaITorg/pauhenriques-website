"use client";

import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { HiOutlineShoppingBag } from "react-icons/hi2";
import PauImage from "@/assets/pau-no-bg.webp";
import marcoSuperior from "@/assets/marco-superior.svg";
import marcoInferior from "@/assets/marco-inferior.svg";
import marcoDerecho from "@/assets/marco-derecho.svg";
import MistDivider from "./MistDivider";
import Image from "next/image";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="relative min-h-[calc(100svh-4rem)] md:min-h-[calc(100svh-5rem)] flex items-start md:items-end overflow-hidden">
      {/* Background — warm caramel → forest animated gradient */}
      <div className="absolute inset-0 animated-gradient-bg z-0" />
      {/* Warm glow behind Pau */}
      <div className="absolute bottom-0 right-0 w-[70%] h-[75%] bg-[radial-gradient(ellipse_at_70%_90%,rgba(166,138,99,0.25)_0%,rgba(99,77,50,0.12)_40%,transparent_70%)] z-0 pointer-events-none" />

      {/* Decorative frames */}
      <Image
        src={marcoSuperior}
        alt=""
        className="absolute top-0 left-0 w-full h-auto z-10 pointer-events-none opacity-40"
        priority
        aria-hidden="true"
      />
      <Image
        src={marcoInferior}
        alt=""
        className="absolute bottom-0 left-0 w-full h-auto z-10 pointer-events-none opacity-40"
        priority
        aria-hidden="true"
      />
      <Image
        src={marcoDerecho}
        alt=""
        className="absolute top-0 right-0 h-full w-auto z-0 pointer-events-none opacity-30 hidden md:block"
        priority
        aria-hidden="true"
      />

      {/* Shimmer rays */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div
          className="absolute w-24 h-[200%] bg-linear-to-b from-primary/10 to-transparent -top-1/2 left-1/4 -rotate-12"
          style={{ animation: "shimmer 20s linear infinite" }}
        />
        <div
          className="absolute w-32 h-[200%] bg-linear-to-b from-primary/5 to-transparent -top-1/2 left-3/4 -rotate-12"
          style={{ animation: "shimmer 20s linear infinite", animationDelay: "7s" }}
        />
        <div
          className="absolute w-16 h-[200%] bg-linear-to-b from-tertiary/8 to-transparent -top-1/2 left-1/2 rotate-12"
          style={{ animation: "shimmer 20s linear infinite", animationDelay: "13s" }}
        />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-5 z-20 flex flex-col md:flex-row md:items-end md:justify-between pt-6 md:pt-0 pb-28 md:pb-20">
        <div className="w-full md:w-1/2 text-center md:text-left md:pb-12">
          {/* Headline */}
          <h1 className="font-cormorant font-semibold text-text-main text-shadow-dark">
            <span
              className="block text-5xl sm:text-6xl md:text-7xl opacity-0"
              style={{ animation: "fadeInUp 0.8s 0.3s ease-out forwards" }}
            >
              Hola!
            </span>
            <span className="block mt-2 text-5xl sm:text-6xl md:text-7xl">
              <span
                className="inline-block opacity-0"
                style={{ animation: "fadeInUp 0.8s 0.7s ease-out forwards" }}
              >
                Yo soy{" "}
              </span>
              <span
                className="inline-block opacity-0 font-dancing-script text-primary text-[1.4em] leading-none"
                style={{ animation: "fadeInUp 0.8s 1.1s ease-out forwards" }}
              >
                Pau
              </span>
            </span>
          </h1>

          {/* Credentials */}
          <p
            className="text-lg sm:text-xl lg:text-2xl leading-relaxed text-text-main/70 mt-6 max-w-lg mx-auto md:mx-0 opacity-0"
            style={{ animation: "fadeInUp 0.8s 1.8s ease-out forwards" }}
          >
            Ingeniera comercial experta en salud integral con certificaciones en
            nutrición, anti-aging y vida sin tóxicos.
          </p>

          {/* CTAs */}
          <div
            className="mt-8 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 sm:gap-4 opacity-0"
            style={{ animation: "fadeInUp 0.8s 2.2s ease-out forwards" }}
          >
            <Link
              href="/tienda"
              className="w-full sm:w-auto bg-primary text-white font-semibold py-3 px-8 rounded-full flex items-center justify-center gap-2.5 transition-all duration-200 hover:bg-primary-hover hover:shadow-[--shadow-glow-primary] active:scale-[0.97]"
            >
              <HiOutlineShoppingBag className="w-5 h-5" />
              Ve a mi tienda
            </Link>
            <a
              href="https://www.instagram.com/pau_henriques/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto border-[1.5px] border-text-main/30 text-text-main font-semibold py-3 px-8 rounded-full flex items-center justify-center gap-2.5 transition-all duration-200 hover:border-text-main/60 hover:bg-text-main/5 active:scale-[0.97]"
            >
              Sígueme
              <FaInstagram className="w-4.5 h-4.5" />
            </a>
            <a
              href="https://wa.me/593991712532"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-whatsapp text-white font-semibold py-3 px-8 rounded-full flex items-center justify-center gap-2.5 transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
            >
              Contáctame
              <FaWhatsapp className="w-4.5 h-4.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Pau image — anchored bottom-right */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-[5%] z-10 pointer-events-none md:h-[70%] lg:h-[75%]">
        <Image
          src={PauImage}
          alt="Pau Henriques"
          className="max-h-[45svh] md:max-h-none md:h-full w-auto opacity-0"
          style={{ animation: "fadeInUp 1s 0.1s ease-out forwards" }}
          priority
        />
      </div>

      <MistDivider />
    </section>
  );
};

export default Hero;

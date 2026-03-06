import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import PauImage from "@/assets/pau-no-bg.webp";
import marcoSuperior from "@/assets/marco-superior.svg";
import marcoInferior from "@/assets/marco-inferior.svg";
import marcoDerecho from "@/assets/marco-derecho.svg";
import MistDivider from "./MistDivider";
import Image from "next/image";

const Hero = () => {
  return (
    <section className="relative min-h-[calc(100svh-4rem)] md:min-h-[calc(100svh-5rem)] flex items-start md:items-end">
      <div className="absolute inset-0 animated-gradient-bg z-0" />

      <Image
        src={marcoSuperior}
        alt=""
        className="absolute top-0 left-0 w-full h-auto z-10 pointer-events-none"
        priority
        aria-hidden="true"
      />
      <Image
        src={marcoInferior}
        alt=""
        className="absolute bottom-0 left-0 w-full h-auto z-10 pointer-events-none"
        priority
        aria-hidden="true"
      />
      <Image
        src={marcoDerecho}
        alt=""
        className="absolute top-0 right-0 h-full w-auto z-0 pointer-events-none opacity-75 hidden md:block"
        priority
        aria-hidden="true"
      />

      {/* Shimmer effects - reduced to 3 for performance */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div
          className="absolute w-24 h-[200%] bg-linear-to-b from-white to-transparent opacity-5 -top-1/2 left-1/4 -rotate-12"
          style={{ animation: "shimmer 20s linear infinite" }}
        />
        <div
          className="absolute w-32 h-[200%] bg-linear-to-b from-white to-transparent opacity-5 -top-1/2 left-3/4 -rotate-12"
          style={{ animation: "shimmer 20s linear infinite", animationDelay: "5s" }}
        />
        <div
          className="absolute w-20 h-[200%] bg-linear-to-b from-white to-transparent opacity-5 -top-1/2 left-1/2 rotate-12"
          style={{ animation: "shimmer 20s linear infinite", animationDelay: "10s" }}
        />
      </div>

      <div className="relative container mx-auto px-5 z-20 flex flex-col md:flex-row md:items-end md:justify-between pt-6 md:pt-0 pb-24 md:pb-16">
        {/* Text content */}
        <div className="w-full md:w-1/2 text-center md:text-left md:pb-12">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-text-main font-mono text-shadow-dark">
            <span
              className="inline-block opacity-0"
              style={{ animation: "fadeInUp 1s 0.5s ease-out forwards" }}
            >
              Hola!
            </span>
            <br />
            <span className="inline-block mt-2">
              <span
                className="inline-block opacity-0"
                style={{ animation: "fadeInUp 1s 1s ease-out forwards" }}
              >
                Yo soy
              </span>{" "}
              <span
                className="inline-block opacity-0 font-dancing-script text-tertiary text-[1.5em]"
                style={{ animation: "fadeInUp 1s 1.5s ease-out forwards" }}
              >
                Pau
              </span>
            </span>
          </h1>

          <p
            className="text-lg sm:text-xl lg:text-2xl leading-relaxed text-secondary mt-6 max-w-lg mx-auto md:mx-0 opacity-0 text-shadow-light"
            style={{ animation: "fadeInUp 1s 2.7s ease-out forwards" }}
          >
            Ingeniera comercial experta en salud integral con certificaciones en
            Nutricion, anti-aging y vida sin toxicos.
          </p>

          <div
            className="mt-8 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 sm:gap-4 opacity-0"
            style={{ animation: "fadeInUp 1s 2.9s ease-out forwards" }}
          >
            <a
              href="/tienda"
              className="w-full sm:w-auto bg-primary text-white font-bold py-3 px-8 rounded-full flex items-center justify-center gap-2 transition-all duration-300 ease-in-out hover:brightness-110 hover:scale-105 active:scale-95"
            >
              Ve a mi tienda
            </a>
            <a
              href="https://www.instagram.com/pau_henriques/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-secondary text-white font-bold py-3 px-8 rounded-full flex items-center justify-center gap-2 transition-all duration-300 ease-in-out hover:brightness-110 hover:scale-105 active:scale-95"
            >
              Sigueme
              <FaInstagram />
            </a>
            <a
              href="https://wa.me/593991712532"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-tertiary text-white font-bold py-3 px-8 rounded-full flex items-center justify-center gap-2 transition-all duration-300 ease-in-out hover:brightness-110 hover:scale-105 active:scale-95"
            >
              Contactame
              <FaWhatsapp />
            </a>
          </div>
        </div>

      </div>

      {/* Hero image - anchored to bottom, 70% of section height on desktop */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-[5%] z-10 pointer-events-none md:h-[70%] lg:h-[75%]">
        <Image
          src={PauImage}
          alt="Pau Henriques"
          className="max-h-[45svh] md:max-h-none md:h-full w-auto opacity-0"
          style={{ animation: "fadeInUp 1s 0.2s ease-out forwards" }}
          priority
        />
      </div>

      <MistDivider />
    </section>
  );
};

export default Hero;

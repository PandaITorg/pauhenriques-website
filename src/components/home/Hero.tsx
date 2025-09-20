import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import PauImage from "../../assets/pau-no-bg.webp";
import marcoSuperior from "../../assets/marco-superior.svg";
import marcoInferior from "../../assets/marco-inferior.svg";
import marcoDerecho from "../../assets/marco-derecho.svg";
import MistDivider from "./MistDivider";

const Hero = () => {
  return (
    <section className="relative h-full flex items-end">
      <div className="absolute inset-0 animated-gradient-bg z-0"></div>

      <img
        src={marcoSuperior}
        alt="Marco superior"
        className="absolute top-0 left-0 w-full h-auto z-10 pointer-events-none"
      />
      <img
        src={marcoInferior}
        alt="Marco inferior"
        className="absolute bottom-0 left-0 w-full h-auto z-10 pointer-events-none"
      />
      <img
        src={marcoDerecho}
        alt="Marco derecho"
        className="absolute top-0 right-0 h-full w-auto z-0 pointer-events-none opacity-75"
      />

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div
          className="absolute w-24 h-[200%] bg-gradient-to-b from-white to-transparent opacity-5 -top-1/2 left-1/4 transform -rotate-12"
          style={{ animation: "shimmer 20s linear infinite" }}
        ></div>
        <div
          className="absolute w-32 h-[200%] bg-gradient-to-b from-white to-transparent opacity-5 -top-1/2 left-3/4 transform -rotate-12"
          style={{
            animation: "shimmer 20s linear infinite",
            animationDelay: "5s",
          }}
        ></div>
        <div
          className="absolute w-16 h-[200%] bg-gradient-to-b from-white to-transparent opacity-5 -top-1/2 left-1/2 transform rotate-12"
          style={{
            animation: "shimmer 20s linear infinite",
            animationDelay: "2s",
          }}
        ></div>
        <div
          className="absolute w-20 h-[200%] bg-gradient-to-b from-white to-transparent opacity-5 -top-1/2 left-1/3 transform rotate-15"
          style={{
            animation: "shimmer 20s linear infinite",
            animationDelay: "8s",
          }}
        ></div>
        <div
          className="absolute w-28 h-[200%] bg-gradient-to-b from-white to-transparent opacity-5 -top-1/2 left-2/3 transform -rotate-15"
          style={{
            animation: "shimmer 20s linear infinite",
            animationDelay: "12s",
          }}
        ></div>
      </div>

      <div className="relative container mx-auto px-4 z-40 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="w-full md:w-1/2 text-center md:text-left flex-grow pt-8 pb-8 md:pb-12">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-text-main font-mono text-shadow-dark">
            <div className="md:hidden">
              <span className="whitespace-nowrap">
                <span
                  className="inline-block opacity-0"
                  style={{
                    animation: "fadeInUp 1s 0.5s ease-out forwards",
                  }}
                >
                  Hola!
                </span>{" "}
                <span
                  className="inline-block opacity-0"
                  style={{ animation: "fadeInUp 1s 1s ease-out forwards" }}
                >
                  Yo soy
                </span>{" "}
                <span
                  className="inline-block opacity-0 font-dancing-script text-tertiary text-[1.5em]"
                  style={{
                    animation: "fadeInUp 1s 1.5s ease-out forwards",
                  }}
                >
                  Pau
                </span>
              </span>
            </div>

            <div className="hidden md:block">
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
                  style={{
                    animation: "fadeInUp 1s 1.5s ease-out forwards",
                  }}
                >
                  Pau
                </span>
              </span>
            </div>
          </h1>
          <p
            className="text-lg sm:text-xl lg:text-2xl leading-relaxed text-secondary mt-6 max-w-lg mx-auto md:mx-0 opacity-0 text-shadow-light"
            style={{ animation: "fadeInUp 1s 2.7s ease-out forwards" }}
          >
            Ingeniera comercial experta en salud integral con certificaciones en
            Nutrición, anti-aging y vida sin tóxicos.
          </p>
          <div
            className="mt-8 flex flex-row flex-wrap items-center justify-center md:justify-start gap-4 opacity-0"
            style={{ animation: "fadeInUp 1s 2.9s ease-out forwards" }}
          >
            <a
              href="/tienda"
              className="bg-primary text-white font-bold py-3 px-8 rounded-full flex items-center space-x-2 transition-all duration-300 ease-in-out hover:brightness-110 hover:scale-105 active:scale-95 transform"
            >
              <span>Ve a mi tienda</span>
            </a>
            <a
              href="https://www.instagram.com/pau_henriques/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary text-white font-bold py-3 px-8 rounded-full flex items-center space-x-2 transition-all duration-300 ease-in-out hover:brightness-110 hover:scale-105 active:scale-95 transform"
            >
              <span>Sígueme</span>
              <FaInstagram />
            </a>
            <a
              href="https://wa.me/593991712532"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-tertiary text-white font-bold py-3 px-8 rounded-full flex items-center space-x-2 transition-all duration-300 ease-in-out hover:brightness-110 hover:scale-105 active:scale-95 transform"
            >
              <span>Contáctame</span>
              <FaWhatsapp />
            </a>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex justify-center md:justify-start items-end">
          <img
            src={PauImage}
            alt="Pau Henriques"
            className="w-full h-auto max-w-[15rem] sm:max-w-xs md:max-w-none opacity-0"
            style={{ animation: "fadeInUp 1s 0.2s ease-out forwards" }}
          />
        </div>
      </div>

      <MistDivider />
    </section>
  );
};

export default Hero;

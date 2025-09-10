import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { useInView } from "react-intersection-observer";
import PauImage from "../assets/pau-no-bg.png";
import marcoSuperior from "../assets/marco-superior.svg";
import marcoInferior from "../assets/marco-inferior.svg";
import marcoDerecho from "../assets/marco-derecho.svg";
import sobreMiPauForrest from "../assets/sobremi-Pau-Forrest.jpg";
import sobreMiJorgeYPau from "../assets/sobre-mi-Jorge-y-Pau.jpg";
import branch from "../assets/branch.svg";

const MistDivider = () => (
  <div className="absolute bottom-0 left-0 w-full h-48 z-50 pointer-events-none -mb-1">
    <div
      className="absolute inset-0"
      style={{ animation: "flow-mist 20s linear infinite" }}
    >
      <svg
        viewBox="0 0 2000 150"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-[200%] h-full"
      >
        <path
          d="M0 100 C 400 150, 600 100, 1000 100 S 1600 50, 2000 100 L 2000 150 L 0 150 Z"
          fill="#343d2a"
          opacity="0.8"
        ></path>
      </svg>
    </div>
    <div
      className="absolute inset-0"
      style={{ animation: "flow-mist 30s linear infinite reverse" }}
    >
      <svg
        viewBox="0 0 2000 150"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-[200%] h-full"
      >
        <path
          d="M0 100 C 350 50, 650 100, 1000 100 S 1700 150, 2000 100 L 2000 150 L 0 150 Z"
          fill="#414934"
          opacity="0.6"
        ></path>
      </svg>
    </div>
  </div>
);

interface AnimatedPolaroidProps {
  src: string;
  alt: string;
  rotation: string;
}

const AnimatedPolaroid = ({ src, alt, rotation }: AnimatedPolaroidProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  return (
    <div ref={ref} className={`relative w-64 mx-auto ${inView ? "fall-in" : "opacity-0"}`}>
      <img src={branch} alt="branch" className="absolute -top-10 -left-10 w-24 h-24 transform -rotate-45" />
      <div className={`polaroid ${rotation}`}>
        <img src={src} alt={alt} className="w-full h-auto" />
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <section className="relative min-h-[calc(100vh-5rem)] flex items-end">
                {/* Background elements */}
        <div className="absolute inset-0 animated-gradient-bg z-0"></div>

        {/* Adaptive SVG Frame */}
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

        {/* Main content grid for text alignment */}
        <div className="relative container mx-auto px-4 z-40 flex flex-col md:flex-row md:items-center md:justify-between">
          {/* Text column */}
          <div className="w-full md:w-1/2 text-center md:text-left flex-grow pt-8 pb-8 md:pb-12">
            <h1 className="text-5xl md:text-7xl font-bold text-text-main font-mono text-shadow-dark">
              {/* Mobile View */}
              <div className="md:hidden">
                <span className="whitespace-nowrap">
                  <span
                    className="inline-block opacity-0"
                    style={{ animation: "fadeInUp 1s 0.5s ease-out forwards" }}
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
                    style={{ animation: "fadeInUp 1s 1.5s ease-out forwards" }}
                  >
                    Pau
                  </span>
                </span>
              </div>

              {/* Desktop View */}
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
                    style={{ animation: "fadeInUp 1s 1.5s ease-out forwards" }}
                  >
                    Pau
                  </span>
                </span>
              </div>
            </h1>
            <p
              className="text-xl lg:text-2xl leading-relaxed text-secondary mt-6 max-w-lg mx-auto md:mx-0 opacity-0 text-shadow-light"
              style={{ animation: "fadeInUp 1s 2.7s ease-out forwards" }}
            >
              Ingeniera comercial experta en salud integral con certificaciones
              en Nutrición, anti-aging y vida sin tóxicos.
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

          {/* Pau's Image Column */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-start items-end">
            <img
              src={PauImage}
              alt="Pau Henriques"
              className="w-full h-auto max-w-xs md:max-w-none opacity-0"
              style={{ animation: "fadeInUp 1s 0.2s ease-out forwards" }}
            />
          </div>
        </div>

        <MistDivider />
      </section>

      <section id="sobre-mi" className="bg-background py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-text-main mb-12 text-center">Sobre Mí</h2>
            
            <div className="space-y-12">
              <p className="text-lg text-text-secondary leading-relaxed">
                Hace 15 años me diagnosticaron Psoriasis en la piel, una condición “incurable” y en ese momento empezó mi interés por entender temas que van más allá de un diagnóstico.
              </p>

              <AnimatedPolaroid src={sobreMiPauForrest} alt="Pau en el bosque" rotation="-rotate-3" />

              <p className="text-lg text-text-secondary leading-relaxed">
                Tuve un gran despertar y una curiosidad incansable en aprender cómo poder sanar mi cuerpo de adentro para afuera. En como vivir un estilo de vida libre de tóxicos.
              </p>

              <p className="text-lg text-text-secondary leading-relaxed">
                Actualmente trabajo junto a mi compañero de vida y esposo Jorge, liderando la Marca Carico en el Ecuador. Nos enfocamos en brindar una mejor salud y estilo de vida a todos nuestros clientes.
              </p>

              <AnimatedPolaroid src={sobreMiJorgeYPau} alt="Jorge y Pau" rotation="rotate-2" />

              <p className="text-lg text-text-secondary leading-relaxed">
                Nuestra filosofía y nuestros productos han mejorado la salud y el estilo de vida que tenemos junto con el de cientos de clientes con testimonios de vida impactantes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
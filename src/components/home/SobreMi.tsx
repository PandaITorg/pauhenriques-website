"use client";

import sobreMiPauForrest from "@/assets/sobremi-Pau-Forrest.webp";
import sobreMiJorgeYPau from "@/assets/sobre-mi-Jorge-y-Pau.webp";
import AnimatedPhoto from "./AnimatedPhoto";
import { useInView } from "react-intersection-observer";

const FadeInBlock = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  return (
    <div
      ref={ref}
      className="transition-all duration-700 ease-out"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(16px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

const SobreMi = () => {
  return (
    <section id="sobre-mi" className="bg-background py-16 md:py-28 relative">
      <div className="container mx-auto px-5">
        {/* Section title */}
        <FadeInBlock>
          <h2 className="font-cormorant text-4xl md:text-5xl font-semibold text-text-main text-center mb-4">
            Mi{" "}
            <span className="font-dancing-script text-primary text-[1.15em]">
              Historia
            </span>
          </h2>
          <div className="w-16 h-0.5 bg-primary/40 mx-auto mb-12 md:mb-16" />
        </FadeInBlock>

        <div className="max-w-5xl mx-auto space-y-16 md:space-y-24">
          {/* Block 1 — Text left, Photo right */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="md:w-1/2 space-y-6">
              <FadeInBlock>
                <p className="text-lg text-text-main/80 leading-relaxed">
                  Hace 15 años me diagnosticaron Psoriasis en la piel, una
                  condición &ldquo;incurable&rdquo; y en ese momento empezó mi interés por
                  entender temas que van más allá de un diagnóstico.
                </p>
              </FadeInBlock>
              <FadeInBlock delay={150}>
                <p className="text-lg text-text-main/80 leading-relaxed">
                  Tuve un gran despertar y una curiosidad incansable en aprender
                  cómo poder sanar mi cuerpo de adentro para afuera. En cómo vivir
                  un estilo de vida libre de tóxicos.
                </p>
              </FadeInBlock>
            </div>
            <div className="md:w-1/2">
              <AnimatedPhoto
                src={sobreMiPauForrest}
                alt="Pau en el bosque"
                className="max-w-xs sm:max-w-sm mx-auto"
              />
            </div>
          </div>

          {/* Block 2 — Photo left, Text right */}
          <div className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-12">
            <div className="md:w-1/2">
              <AnimatedPhoto
                src={sobreMiJorgeYPau}
                alt="Jorge y Pau"
                className="max-w-xs sm:max-w-sm mx-auto"
              />
            </div>
            <div className="md:w-1/2 space-y-6">
              <FadeInBlock>
                <p className="text-lg text-text-main/80 leading-relaxed">
                  Actualmente trabajo junto a mi compañero de vida y esposo Jorge,
                  liderando la Marca Carico en el Ecuador. Nos enfocamos en brindar
                  una mejor salud y estilo de vida a todos nuestros clientes.
                </p>
              </FadeInBlock>
              <FadeInBlock delay={150}>
                <p className="text-lg text-text-main/80 leading-relaxed">
                  Nuestra filosofía y nuestros productos han mejorado la salud y el
                  estilo de vida que tenemos junto con el de cientos de clientes con
                  testimonios de vida impactantes.
                </p>
              </FadeInBlock>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SobreMi;

"use client";

import { useInView } from "react-intersection-observer";
import Link from "next/link";
import podcastImage from "@/assets/de-toxica-a-sin-toxicos.jpg";
import Image from "next/image";
import { FaHeadphones } from "react-icons/fa";

const PodcastSection = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  return (
    <section
      ref={ref}
      className="bg-background py-16 md:py-28 overflow-hidden relative"
    >
      <div className="container mx-auto px-5">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 max-w-5xl mx-auto">
          {/* Text */}
          <div
            className="md:w-1/2 text-center md:text-left transition-all duration-700 ease-out"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateX(0)" : "translateX(-24px)",
            }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-primary mb-4">
              <FaHeadphones className="w-3.5 h-3.5" />
              Podcast
            </span>
            <h2 className="font-cormorant text-3xl sm:text-4xl md:text-5xl font-semibold text-text-main mb-2">
              De{" "}
              <span className="font-dancing-script text-primary text-[1.1em]">
                Tóxica
              </span>{" "}
              a Sin Tóxicos
            </h2>
            <p className="text-base md:text-lg text-text-main/60 mb-8 leading-relaxed max-w-md mx-auto md:mx-0">
              En este espacio vamos a tocar temas sobre salud, bienestar y
              desarrollo personal de una forma muy real y vulnerable. Estaré
              acompañada algunas veces de mi esposo, invitados especiales y
              gurús de temas de interés.
            </p>
            <Link
              href="/podcast"
              className="inline-flex items-center gap-2.5 bg-primary text-white font-semibold py-3 px-8 rounded-full transition-all duration-200 hover:bg-primary-hover hover:shadow-[--shadow-glow-primary] active:scale-[0.97]"
            >
              Ver episodios
            </Link>
          </div>

          {/* Album cover */}
          <div
            className="md:w-1/2 transition-all duration-700 ease-out"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateX(0) rotate(0deg)" : "translateX(24px) rotate(2deg)",
              transitionDelay: "200ms",
            }}
          >
            <div className="relative max-w-sm mx-auto group">
              <div className="rounded-2xl overflow-hidden shadow-xl transition-transform duration-500 group-hover:-rotate-1 group-hover:scale-[1.02]">
                <Image
                  src={podcastImage}
                  alt="De Tóxica a Sin Tóxicos Podcast"
                  width={800}
                  height={800}
                  className="w-full h-auto object-cover"
                />
              </div>
              {/* Subtle glow behind */}
              <div className="absolute -inset-4 bg-primary/8 rounded-3xl blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PodcastSection;

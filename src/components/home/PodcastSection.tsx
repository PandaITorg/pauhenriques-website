"use client";

import { useInView } from "react-intersection-observer";
import Link from "next/link";
import podcastImage from "@/assets/de-toxica-a-sin-toxicos.jpg";
import MistDivider from "./MistDivider";
import Image from "next/image";

const PodcastSection = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  return (
    <section
      ref={ref}
      className="bg-tertiary pt-16 pb-32 overflow-hidden relative"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div
            className={`md:w-1/2 text-center md:text-left transition-all duration-1000 ${
              inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-text-inverted mb-4">
              De Tóxica a Sin Tóxicos
            </h2>
            <p className="text-lg text-text-inverted mb-6">
              En este espacio vamos a tocar temas sobre salud, bienestar y
              desarrollo personal de una forma muy real y vulnerable. Estaré
              acompañada algunas veces de mi esposo, invitados especiales y
              gurus de temas de interés.
            </p>
            <Link
              href="/podcast"
              className="inline-block bg-primary text-white font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out hover:brightness-110 hover:scale-105 active:scale-95 transform"
            >
              Ver episodios
            </Link>
          </div>
          <div
            className={`md:w-1/2 transition-all duration-1000 delay-300 ${
              inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            }`}
          >
            <Image
              src={podcastImage}
              alt="De Tóxica a Sin Tóxicos Podcast"
              width={800}
              height={800}
              className="rounded-lg shadow-2xl w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
      <MistDivider />
    </section>
  );
};

export default PodcastSection;

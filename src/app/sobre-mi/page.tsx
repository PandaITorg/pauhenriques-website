import pauSobreMi1 from '@/assets/pau-sobre-mi-1.jpg';
import pauSobreMi2 from '@/assets/pau-sobre-mi-2.jpg';
import { FaInstagram, FaPodcast } from 'react-icons/fa';
import SobreMiSchema from "@/components/schemas/SobreMiSchema";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sobre Mí | Pau Henriques - Mi Historia de Sanación y Bienestar",
  description:
    "Conoce mi historia con la psoriasis y cómo transformé mi vida a través de una alimentación saludable y un estilo de vida sin tóxicos. Te ayudo a sanar tu cuerpo de forma natural.",
  alternates: {
    canonical: "https://www.pauhenriques.com/sobre-mi",
  },
};

export default function SobreMi() {
  return (
    <>
      <SobreMiSchema />
      <div className="px-4 sm:px-20 py-8 bg-[#a4ac85] text-[#343d2a]">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-[#343d2a]">Sobre Mí</h1>

        {/* Section 1: Mi Misión */}
        <section className="flex flex-col md:flex-row items-center gap-8 mb-12">
          <div className="md:w-1/2">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-[#343d2a] text-left">Mi Misión: Un Hogar Consciente y Saludable</h2>
            <p className="mb-4 text-[#343d2a] text-justify">
              Soy Pau, ingeniera comercial, coach de vida sin tóxicos, mamá y esposa. A lo largo de mi vida he descubierto que la verdadera riqueza está en la salud, y que cada decisión que tomamos en nuestro hogar impacta directamente en el bienestar de nuestra familia. Mi pasión es ayudar a las personas a vivir más conscientes, eliminando los tóxicos que silenciosamente afectan nuestro cuerpo, y creando hábitos que nos permitan disfrutar de una vida más plena, energética y saludable.
            </p>
            <p className="text-[#343d2a] text-justify">
              Hoy desarrollo mi misión junto a Carico, una marca que representa innovación, respaldo científico y confianza. Trabajo con sus tecnologías patentadas porque creo profundamente en brindar soluciones reales: agua pura, alimentos cocinados sin liberar metales ni disruptores endocrinos, espacios libres de contaminación y descanso reparador. Lo que hago no es vender productos, es compartir un estilo de vida que yo misma vivo en casa, porque estoy convencida de que cuando invertimos en salud, invertimos en lo más valioso que tenemos: nuestra familia y nuestro futuro.
            </p>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative p-4 bg-white shadow-lg -rotate-3 hover:rotate-0 transition-transform duration-300 ease-in-out">
              <video
                className="w-full max-w-md rounded-lg"
                muted
                autoPlay
                loop
                src="https://res.cloudinary.com/dro8ckpco/video/upload/v1757636446/premiomapa_klw5lo.mp4"
                aria-describedby="video-description"
              >
                Tu navegador no soporta el tag de video. Este video muestra a Pau Henriques explicando los beneficios de transformar tu vida sin consumir medicinas.
              </video>
              <p id="video-description" className="sr-only">Video: Pau Henriques explica cómo transformar tu vida sin consumir medicinas, destacando el uso de sartenes de acero quirúrgico para una alimentación saludable y libre de tóxicos.</p>
            </div>
          </div>
        </section>

        {/* Section 2: Mejora tu salud y calidad de vida */}
        <section className="flex flex-col md:flex-row items-center gap-8 mb-12">
          <div className="md:w-1/2 flex flex-col items-center text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-[#343d2a]">Mejora tu salud y calidad de vida sin medicina</h2>
            <p className="mb-4 text-[#343d2a]">
              Te ayudo a encontrar soluciones en tu salud fuera de consultorios y recetas médicas, entendiendo tu cuerpo, sus reacciones y como poder sanarlo de forma natural e integral libre de toxinas.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <div className="relative p-4 bg-white shadow-lg rotate-3 hover:rotate-0 transition-transform duration-300 ease-in-out">
                <Image src={pauSobreMi1} alt="Pau Henriques en un entorno natural, sonriendo y feliz" width={192} height={256} className="w-48 h-auto" />
              </div>
              <div className="relative p-4 bg-white shadow-lg -rotate-3 hover:rotate-0 transition-transform duration-300 ease-in-out">
                <Image src={pauSobreMi2} alt="Pau Henriques y Jorge, su esposo, en un evento de salud integral" width={192} height={256} className="w-48 h-auto" />
              </div>
            </div>
          </div>
          <div className="md:w-1/2 flex flex-col items-center justify-center">
            <p className="text-lg text-center mb-4 text-[#343d2a]">
              ¿Quieres inspiración diaria y consejos de salud? Sígueme en Instagram o explora productos para tu bienestar.
            </p>
            <a
              href="https://www.instagram.com/pau_henriques/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#a68a63] hover:bg-[#562f10] text-white font-bold py-2 px-4 rounded-full mb-4 transition-colors duration-300 inline-flex items-center justify-center w-56"
            >
              <FaInstagram className="mr-2" /> Ir a Instagram
            </a>
            <Link
              href="/podcast"
              className="bg-[#a68a63] hover:bg-[#562f10] text-white font-bold py-2 px-4 rounded-full transition-colors duration-300 inline-flex items-center justify-center w-56"
            >
              <FaPodcast className="mr-2" /> Escucha mi Podcast
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

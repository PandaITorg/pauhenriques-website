import pauSobreMi1 from '@/assets/pau-sobre-mi-1.jpg';
import pauSobreMi2 from '@/assets/pau-sobre-mi-2.jpg';
import { FaInstagram, FaPodcast } from 'react-icons/fa';
import SobreMiSchema from "@/components/schemas/SobreMiSchema";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sobre Mi | Pau Henriques - Mi Historia de Sanacion y Bienestar",
  description:
    "Conoce mi historia con la psoriasis y como transforme mi vida a traves de una alimentacion saludable y un estilo de vida sin toxicos. Te ayudo a sanar tu cuerpo de forma natural.",
  alternates: {
    canonical: "https://www.pauhenriques.com/sobre-mi",
  },
};

export default function SobreMi() {
  return (
    <>
      <SobreMiSchema />
      <div className="px-5 sm:px-8 md:px-20 py-8 md:py-12 bg-tertiary text-text-inverted">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 md:mb-12">Sobre Mi</h1>

        <section className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 mb-12 md:mb-16">
          <div className="md:w-1/2">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Mi Mision: Un Hogar Consciente y Saludable</h2>
            <p className="mb-4 leading-relaxed">
              Soy Pau, ingeniera comercial, coach de vida sin toxicos, mama y esposa. A lo largo de mi vida he descubierto que la verdadera riqueza esta en la salud, y que cada decision que tomamos en nuestro hogar impacta directamente en el bienestar de nuestra familia. Mi pasion es ayudar a las personas a vivir mas conscientes, eliminando los toxicos que silenciosamente afectan nuestro cuerpo, y creando habitos que nos permitan disfrutar de una vida mas plena, energetica y saludable.
            </p>
            <p className="leading-relaxed">
              Hoy desarrollo mi mision junto a Carico, una marca que representa innovacion, respaldo cientifico y confianza. Trabajo con sus tecnologias patentadas porque creo profundamente en brindar soluciones reales: agua pura, alimentos cocinados sin liberar metales ni disruptores endocrinos, espacios libres de contaminacion y descanso reparador. Lo que hago no es vender productos, es compartir un estilo de vida que yo misma vivo en casa, porque estoy convencida de que cuando invertimos en salud, invertimos en lo mas valioso que tenemos: nuestra familia y nuestro futuro.
            </p>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative p-3 sm:p-4 bg-white shadow-lg -rotate-3 hover:rotate-0 transition-transform duration-300 ease-in-out max-w-sm w-full">
              <video
                className="w-full rounded-lg"
                muted
                autoPlay
                loop
                playsInline
                src="https://res.cloudinary.com/dro8ckpco/video/upload/v1757636446/premiomapa_klw5lo.mp4"
                aria-describedby="video-description"
              >
                Tu navegador no soporta el tag de video.
              </video>
              <p id="video-description" className="sr-only">Video: Pau Henriques explica como transformar tu vida sin consumir medicinas.</p>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 mb-12">
          <div className="md:w-1/2 flex flex-col items-center text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Mejora tu salud y calidad de vida sin medicina</h2>
            <p className="mb-4 leading-relaxed">
              Te ayudo a encontrar soluciones en tu salud fuera de consultorios y recetas medicas, entendiendo tu cuerpo, sus reacciones y como poder sanarlo de forma natural e integral libre de toxinas.
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-6">
              <div className="relative p-3 sm:p-4 bg-white shadow-lg rotate-3 hover:rotate-0 transition-transform duration-300 ease-in-out">
                <Image src={pauSobreMi1} alt="Pau Henriques en un entorno natural" width={176} height={234} className="w-36 sm:w-44 h-auto" />
              </div>
              <div className="relative p-3 sm:p-4 bg-white shadow-lg -rotate-3 hover:rotate-0 transition-transform duration-300 ease-in-out">
                <Image src={pauSobreMi2} alt="Pau Henriques y Jorge en un evento de salud" width={176} height={234} className="w-36 sm:w-44 h-auto" />
              </div>
            </div>
          </div>
          <div className="md:w-1/2 flex flex-col items-center justify-center gap-3">
            <p className="text-base md:text-lg text-center mb-2 leading-relaxed">
              Quieres inspiracion diaria y consejos de salud? Sigueme en Instagram o explora productos para tu bienestar.
            </p>
            <a
              href="https://www.instagram.com/pau_henriques/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary hover:bg-accent text-white font-bold py-3 px-6 rounded-full transition-colors duration-300 inline-flex items-center justify-center w-full sm:w-56"
            >
              <FaInstagram className="mr-2" /> Ir a Instagram
            </a>
            <Link
              href="/podcast"
              className="bg-primary hover:bg-accent text-white font-bold py-3 px-6 rounded-full transition-colors duration-300 inline-flex items-center justify-center w-full sm:w-56"
            >
              <FaPodcast className="mr-2" /> Escucha mi Podcast
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

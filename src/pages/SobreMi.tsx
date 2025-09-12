import pauSobreMi1 from '../assets/pau-sobre-mi-1.jpg';
import pauSobreMi2 from '../assets/pau-sobre-mi-2.jpg';
import { FaInstagram, FaPodcast } from 'react-icons/fa';

export default function SobreMi() {
  return (
    <div className="px-4 py-8 bg-[#a4ac85] text-[#343d2a]">
      <h1 className="text-4xl font-bold text-center mb-8 text-[#343d2a]">Sobre Mí</h1>

      {/* Section 1: Transformando vidas */}
      <section className="flex flex-col md:flex-row items-center gap-8 mb-12">
        <div className="md:w-1/2">
          <h2 className="text-3xl font-semibold mb-4 text-[#343d2a]">Transformando vidas a través del conocimiento</h2>
          <p className="mb-4 text-[#343d2a]">
            Transformar tu vida sin consumir medicinas puede parecer un desafío, pero con el uso de sartenes de acero quirúrgico, es posible lograr una alimentación saludable y libre de tóxicos. Estas sartenes están diseñadas para cocinar sin necesidad de añadir aceites o grasas, lo que permite preparar comidas más ligeras y nutritivas. Además, el acero quirúrgico es un material seguro que no libera sustancias nocivas al calentarse, a diferencia de otros tipos de utensilios de cocina.
          </p>
          <p className="mb-4 text-[#343d2a]">
            Al adoptar una dieta basada en alimentos frescos y cocinados en sartenes de acero quirúrgico, puedes reducir significativamente la ingesta de aditivos y conservantes que a menudo se encuentran en los alimentos procesados. Esto no solo mejora tu salud física, sino que también puede tener un impacto positivo en tu bienestar mental y emocional. Cocinar con estos utensilios te permite disfrutar de los sabores naturales de los alimentos, promoviendo una relación más consciente y saludable con la comida.
          </p>
          <p className="text-[#343d2a]">
            Finalmente, el uso de sartenes de acero quirúrgico puede ser una inversión a largo plazo en tu salud. Estos utensilios son duraderos y fáciles de limpiar, lo que facilita mantener una cocina libre de contaminantes. Al enfocarte en una alimentación natural y libre de tóxicos, puedes experimentar una mejora en tu energía, digestión y en general, en tu calidad de vida. ¡Transformar tu vida nunca ha sido tan sencillo y delicioso!
          </p>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <div className="relative p-4 bg-white shadow-lg -rotate-3 hover:rotate-0 transition-transform duration-300 ease-in-out">
                        <video
              className="w-full max-w-md rounded-lg"
              muted
              autoPlay
              src="https://res.cloudinary.com/dro8ckpco/video/upload/v1757636446/premiomapa_klw5lo.mp4"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>

      {/* Section 2: Mejora tu salud y calidad de vida */}
      <section className="flex flex-col md:flex-row items-center gap-8 mb-12">
        <div className="md:w-1/2">
          <h2 className="text-3xl font-semibold mb-4 text-[#343d2a]">Mejora tu salud y calidad de vida sin medicina</h2>
          <p className="mb-4 text-[#343d2a]">
            Te ayudo a encontrar soluciones en tu salud fuera de consultorios y recetas médicas, entendiendo tu cuerpo, sus reacciones y como poder sanarlo de forma natural e integral libre de toxinas.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="relative p-4 bg-white shadow-lg rotate-3 hover:rotate-0 transition-transform duration-300 ease-in-out">
              <img src={pauSobreMi1} alt="Pau Enriquez 1" className="w-48 h-auto" />
            </div>
            <div className="relative p-4 bg-white shadow-lg -rotate-3 hover:rotate-0 transition-transform duration-300 ease-in-out">
              <img src={pauSobreMi2} alt="Pau Enriquez 2" className="w-48 h-auto" />
            </div>
          </div>
        </div>
        <div className="md:w-1/2 flex flex-col items-center justify-center">
          <p className="text-lg text-center mb-4 text-[#343d2a]">
            ¿Quieres inspiración diaria y consejos de salud? Sígueme en Instagram o explora productos para tu bienestar.
          </p>
          <a
            href="https://www.instagram.com/pauhenriques/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#a68a63] hover:bg-[#562f10] text-white font-bold py-2 px-4 rounded-full mb-4 transition-colors duration-300 inline-flex items-center justify-center w-56"
          >
            <FaInstagram className="mr-2" /> Ir a Instagram
          </a>
          <a
            href="/podcast"
            className="bg-[#a68a63] hover:bg-[#562f10] text-white font-bold py-2 px-4 rounded-full transition-colors duration-300 inline-flex items-center justify-center w-56"
          >
            <FaPodcast className="mr-2" /> Escucha mi Podcast
          </a>
        </div>
      </section>
    </div>
  );
}
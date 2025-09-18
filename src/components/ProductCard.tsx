import React from 'react';

// Placeholder for product images - replace with actual imports
import placeholderImage1 from '../assets/de-toxica-a-sin-toxicos.webp';
import placeholderImage2 from '../assets/pau-sobre-mi-1.jpg';
import placeholderImage3 from '../assets/pau-sobre-mi-2.jpg';
import placeholderImage4 from '../assets/sobremi-Pau-Forrest.webp';
import placeholderImage5 from '../assets/hero-page.png';
import placeholderImage6 from '../assets/pau-no-bg.webp';
import placeholderImage7 from '../assets/sobre-mi-Jorge-y-Pau.webp';

export interface ProductCardProps {
  image: string;
  title: string;
  description: string;
  whatsappLink: string;
}

export const productCardsData: ProductCardProps[] = [
  {
    image: placeholderImage1,
    title: "Producto Estrella 1",
    description: "Una descripción breve y atractiva del producto 1. Destaca sus beneficios principales.",
    whatsappLink: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20el%20Producto%20Estrella%201,%20soy:%20%20",
  },
  {
    image: placeholderImage2,
    title: "Producto Innovador 2",
    description: "Descubre cómo este producto puede transformar tu día a día. Calidad garantizada.",
    whatsappLink: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20el%20Producto%20Innovador%202,%20soy:%20%20",
  },
  {
    image: placeholderImage3,
    title: "Solución Premium 3",
    description: "La elección perfecta para quienes buscan lo mejor. Eficacia y resultados comprobados.",
    whatsappLink: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20la%20Soluci%C3%B3n%20Premium%203,%20soy:%20%20",
  },
  {
    image: placeholderImage4,
    title: "Esencial para tu Bienestar 4",
    description: "Un producto indispensable para mantener tu equilibrio y salud. No te lo pierdas.",
    whatsappLink: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20el%20Esencial%20para%20tu%20Bienestar%204,%20soy:%20%20",
  },
  {
    image: placeholderImage5,
    title: "Novedad Exclusiva 5",
    description: "Sé de los primeros en probar esta innovación que está revolucionando el mercado.",
    whatsappLink: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20la%20Novedad%20Exclusiva%205,%20soy:%20%20",
  },
  {
    image: placeholderImage6,
    title: "Kit Completo 6",
    description: "Todo lo que necesitas en un solo paquete. Ideal para empezar tu cambio de vida.",
    whatsappLink: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20el%20Kit%20Completo%206,%20soy:%20%20",
  },
  {
    image: placeholderImage7,
    title: "Asesoría Personalizada 7",
    description: "Obtén el apoyo que necesitas con nuestra asesoría experta. Tu bienestar es nuestra prioridad.",
    whatsappLink: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20la%20Asesor%C3%ADa%20Personalizada%207,%20soy:%20%20",
  },
];

export const ProductCard: React.FC<ProductCardProps> = ({ image, title, description, whatsappLink }) => (
  <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105">
    <img src={image} alt={title} className="w-full h-48 object-cover" />
    <div className="p-4">
      <h3 className="font-bold text-xl mb-2 text-[#343d2a]">{title}</h3>
      <p className="text-gray-700 text-base mb-4">{description}</p>
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-[#a68a63] hover:bg-[#562f10] text-white font-bold py-2 px-4 rounded-md text-center transition-colors duration-300"
      >
        Preguntar por WhatsApp
      </a>
    </div>
  </div>
);

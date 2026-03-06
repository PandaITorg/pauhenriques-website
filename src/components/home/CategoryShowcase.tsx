"use client";

import Link from "next/link";
import { FaUtensils, FaHome, FaBed } from "react-icons/fa";

const categories = [
  {
    name: "Cocina",
    description: "Ollas, sartenes y utensilios de acero quirurgico libre de toxicos",
    icon: FaUtensils,
    href: "/tienda?tab=catalogo",
    color: "bg-primary/10 text-primary",
  },
  {
    name: "Hogar y Salud",
    description: "Purificadores de agua, aire y sistemas de limpieza avanzados",
    icon: FaHome,
    href: "/tienda?tab=catalogo",
    color: "bg-secondary/10 text-secondary",
  },
  {
    name: "Dormitorio",
    description: "Sistemas de descanso con tecnologia Earthing para dormir mejor",
    icon: FaBed,
    href: "/tienda?tab=catalogo",
    color: "bg-tertiary/20 text-text-inverted",
  },
];

const CategoryShowcase = () => {
  return (
    <section className="bg-white py-12 md:py-20">
      <div className="container mx-auto px-5">
        <h2 className="text-2xl md:text-3xl font-bold text-text-inverted text-center mb-3">
          Categorias para tu Bienestar
        </h2>
        <p className="text-text-inverted/50 text-center mb-8 md:mb-12 max-w-lg mx-auto">
          Productos disenados para eliminar toxicos de cada area de tu vida
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="group bg-gray-50 hover:bg-white rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg border border-transparent hover:border-gray-100"
            >
              <div
                className={`w-14 h-14 rounded-full ${cat.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
              >
                <cat.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-text-inverted mb-2">{cat.name}</h3>
              <p className="text-sm text-text-inverted/50 leading-relaxed">
                {cat.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;

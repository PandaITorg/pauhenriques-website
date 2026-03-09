"use client";

import Link from "next/link";
import { FaUtensils, FaHome, FaBed } from "react-icons/fa";
import { useInView } from "react-intersection-observer";

const categories = [
  {
    name: "Cocina",
    description:
      "Ollas, sartenes y utensilios de acero quirúrgico libre de tóxicos",
    icon: FaUtensils,
    href: "/tienda?tab=catalogo",
  },
  {
    name: "Hogar y Salud",
    description:
      "Purificadores de agua, aire y sistemas de limpieza avanzados",
    icon: FaHome,
    href: "/tienda?tab=catalogo",
  },
  {
    name: "Dormitorio",
    description:
      "Sistemas de descanso con tecnología Earthing para dormir mejor",
    icon: FaBed,
    href: "/tienda?tab=catalogo",
  },
];

const CategoryShowcase = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <section ref={ref} className="bg-warm-800 py-16 md:py-24 relative overflow-hidden">
      {/* Warm ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[radial-gradient(ellipse,rgba(166,138,99,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="container mx-auto px-5 relative">
        {/* Section header */}
        <div
          className="text-center mb-10 md:mb-14 transition-all duration-700 ease-out"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(16px)",
          }}
        >
          <span className="inline-block text-xs font-semibold tracking-wider uppercase text-primary mb-3">
            Catálogo Carico
          </span>
          <h2 className="font-cormorant text-3xl md:text-4xl font-semibold text-text-main mb-3">
            Categorías para tu Bienestar
          </h2>
          <p className="text-text-main/50 max-w-lg mx-auto">
            Productos diseñados para eliminar tóxicos de cada área de tu vida
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
          {categories.map((cat, i) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="group bg-warm-700/50 border border-border-warm rounded-xl p-6 text-center transition-all duration-300 hover:border-primary/40 hover:shadow-[--shadow-glow-primary]"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(20px)",
                transitionDelay: `${200 + i * 120}ms`,
                transitionDuration: "700ms",
                transitionProperty: "all",
              }}
            >
              <div className="w-14 h-14 rounded-full bg-primary-muted flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <cat.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-cormorant text-xl font-semibold text-text-main mb-2">
                {cat.name}
              </h3>
              <p className="text-sm text-text-main/50 leading-relaxed">
                {cat.description}
              </p>
              <span className="inline-block mt-4 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Explorar &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;

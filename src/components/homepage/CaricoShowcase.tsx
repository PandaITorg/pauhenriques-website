'use client';

import { motion } from 'framer-motion';

const CATEGORIES = [
  {
    name: 'Cocina',
    description: 'Sartenes, ollas y utensilios libres de PFAS y metales pesados',
    bg: '#634d32',
  },
  {
    name: 'Hogar y Salud',
    description: 'Purificadores de agua y aire para un ambiente limpio',
    bg: '#7a6240',
  },
  {
    name: 'Dormitorio',
    description: 'Tecnología de descanso para recuperarte mientras duermes',
    bg: '#4f3c25',
  },
];

export default function CaricoShowcase() {
  return (
    <section
      className="py-16 md:py-24"
      style={{ backgroundColor: 'var(--color-warm-900)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--color-primary)' }}
          >
            Catálogo Carico
          </p>
          <h2
            className="font-cormorant text-4xl md:text-5xl lg:text-6xl font-medium"
            style={{ color: 'var(--color-text-main)' }}
          >
            Productos premium para cada rincón de tu hogar
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.name}
              className="group relative rounded-xl overflow-hidden cursor-pointer"
              style={{ aspectRatio: '4/3' }}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            >
              {/* Background */}
              <div
                className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105"
                style={{ backgroundColor: cat.bg }}
              />

              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, var(--color-bosque-profundo-900) 0%, rgba(14,18,10,0.55) 45%, transparent 100%)',
                }}
              />

              {/* Text */}
              <div
                className="absolute bottom-0 left-0 right-0 p-6 transition-transform duration-300 ease-out group-hover:-translate-y-1"
              >
                <h3
                  className="font-cormorant text-3xl md:text-4xl font-semibold text-white mb-1"
                >
                  {cat.name}
                </h3>
                <p
                  className="text-sm leading-snug"
                  style={{ color: 'var(--color-warm-200)' }}
                >
                  {cat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center mt-12 md:mt-16">
          <a
            href="https://wa.me/593000000000?text=Hola%20Pau%2C%20me%20gustar%C3%ADa%20agendar%20una%20asesor%C3%ADa%20personalizada%20sobre%20productos%20Carico"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full py-3 px-8 font-semibold text-white text-sm transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{ backgroundColor: 'var(--color-whatsapp)' }}
          >
            {/* WhatsApp icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 shrink-0"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Agenda tu asesoría personalizada
          </a>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { FaInstagram } from 'react-icons/fa6';
import sobreMiPau from '@/assets/sobremi-Pau-Forrest.webp';

export default function AboutCondensed() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.2 });

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-28"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-[45%_55%] gap-12 md:gap-16 lg:gap-20 items-center">
          {/* ── Left: photo with offset caramel frame ── */}
          <motion.div
            initial={{ opacity: 0, x: -48 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -48 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm mx-auto md:mx-0"
          >
            {/* Offset frame (mockup spec: top:12 right:12 bottom:-12 left:-12) */}
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 0.4 } : { opacity: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute pointer-events-none rounded-2xl"
              style={{
                top: '12px',
                right: '12px',
                bottom: '-12px',
                left: '-12px',
                border: '2px solid var(--color-primary)',
              }}
            />

            {/* Photo */}
            <div
              className="relative overflow-hidden rounded-2xl"
              style={{
                aspectRatio: '3 / 4',
                backgroundColor: 'var(--color-warm-800)',
              }}
            >
              <Image
                src={sobreMiPau}
                alt="Pau Henriques"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 80vw, 40vw"
              />
              {/* Subtle warm overlay */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(166,138,99,0.08) 0%, transparent 60%)',
                }}
              />
            </div>
          </motion.div>

          {/* ── Right: condensed copy ── */}
          <div className="flex flex-col gap-6">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-[11px] font-semibold uppercase font-sans"
              style={{
                letterSpacing: '0.2em',
                color: 'var(--color-primary)',
              }}
            >
              Sobre Mí
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="font-cormorant font-medium leading-[1.15]"
              style={{
                color: 'var(--color-text-main)',
                fontSize: 'clamp(1.9rem, 3vw, 2.4rem)',
              }}
            >
              De{' '}
              <span
                className="font-dancing-script italic"
                style={{
                  color: 'var(--color-primary)',
                  fontSize: '1.15em',
                  fontWeight: 400,
                }}
              >
                tóxica
              </span>{' '}
              a guía de hogares conscientes.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="font-sans leading-relaxed"
              style={{
                color: 'var(--color-text-main)',
                opacity: 0.75,
                fontSize: '1rem',
              }}
            >
              Soy Pau Henriques. Pasé años creyendo que vivía sano hasta que entendí
              cuántos tóxicos había en mi cocina, mi cuarto y los productos de cada
              día. Esa búsqueda se volvió mi misión.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="font-sans leading-relaxed"
              style={{
                color: 'var(--color-text-main)',
                opacity: 0.75,
                fontSize: '1rem',
              }}
            >
              Hoy ayudo a familias a transformar sus hogares en espacios libres de
              tóxicos: cocina, descanso, agua, aire. Comienzos conscientes para vidas
              que florecen.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap gap-3 mt-2"
            >
              <Link
                href="/sobre-mi"
                className="inline-flex items-center justify-center font-medium text-sm rounded-full transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  padding: '12px 32px',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-main)',
                  border: '1.5px solid rgba(193,196,167,0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(193,196,167,0.4)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-main)';
                }}
              >
                Conoce mi historia
              </Link>
              <a
                href="https://www.instagram.com/pau_henriques/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 justify-center font-medium text-sm rounded-full transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  padding: '12px 24px',
                  color: 'var(--color-text-main)',
                  opacity: 0.75,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.color = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.75';
                  e.currentTarget.style.color = 'var(--color-text-main)';
                }}
              >
                <FaInstagram className="w-4 h-4" />
                Instagram
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

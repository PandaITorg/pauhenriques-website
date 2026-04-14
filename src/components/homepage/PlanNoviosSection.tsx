'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';

interface PlanNoviosSectionProps {
  imageUrl?: string;
}

const PARTICLE_COUNT = 8;

interface Particle {
  left: string;
  delay: string;
  duration: string;
  size: number;
}

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    left: `${(i / PARTICLE_COUNT) * 100 + Math.random() * 8}%`,
    delay: `${(Math.random() * 4.2).toFixed(2)}s`,
    duration: `${(6.5 + Math.random() * 2.5).toFixed(2)}s`,
    size: 3 + Math.round(Math.random() * 3),
  }));
}

export default function PlanNoviosSection({ imageUrl }: PlanNoviosSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.2 });
  const [particles, setParticles] = useState<Particle[]>([]);

  // Generate particles client-side only to avoid SSR hydration mismatch from Math.random.
  useEffect(() => {
    setParticles(createParticles());
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{
        backgroundColor: '#2a2014',
        paddingTop: 'clamp(80px, 10vw, 100px)',
        paddingBottom: 'clamp(80px, 10vw, 96px)',
      }}
    >
      {/* Radial glows */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 20% 20%, rgba(212,175,55,0.06) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(166,138,99,0.08) 0%, transparent 55%)',
        }}
      />

      {/* Texture overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.03,
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(245,237,227,0.5) 0 1px, transparent 1px 4px)',
        }}
      />

      {/* Floating gold particles */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <span
            key={i}
            className="absolute bottom-0 rounded-full"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              backgroundColor: '#D4AF37',
              animation: `noviosFloat ${p.duration} ease-in ${p.delay} infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-6xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 lg:gap-18 items-center">
          {/* ── Left: copy ── */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -32 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >
            {/* Eyebrow with side lines */}
            <div className="flex items-center gap-3 mb-5">
              <span
                className="h-px flex-1 max-w-12"
                style={{ backgroundColor: 'rgba(212,175,55,0.4)' }}
                aria-hidden="true"
              />
              <p
                className="text-[11px] font-bold uppercase"
                style={{
                  letterSpacing: '0.28em',
                  color: '#D4AF37',
                }}
              >
                Plan de Novios
              </p>
              <span
                className="h-px flex-1 max-w-12"
                style={{ backgroundColor: 'rgba(212,175,55,0.4)' }}
                aria-hidden="true"
              />
            </div>

            <h2
              className="font-cormorant font-medium leading-[1.1] mb-5"
              style={{
                color: '#f5ede3',
                fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)',
              }}
            >
              Empieza tu vida juntos{' '}
              <em
                className="italic font-normal"
                style={{ color: '#ddd0b8' }}
              >
                libre de tóxicos
              </em>
              .
            </h2>

            <p
              className="mb-9 leading-relaxed font-sans"
              style={{
                color: '#ddd0b8',
                fontSize: '1.02rem',
              }}
            >
              Crea tu lista de regalos con productos que cuidan tu salud desde el primer día.
              Tus invitados contribuyen, tú eliges lo que más necesitan en tu nuevo hogar.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                href="/plan-novios/registrar"
                className="inline-flex items-center justify-center font-bold text-sm rounded-full transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  backgroundColor: '#D4AF37',
                  color: '#2a2014',
                  padding: '13px 30px',
                  letterSpacing: '0.02em',
                  boxShadow: '0 8px 28px rgba(212,175,55,0)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e8c96b';
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(212,175,55,0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#D4AF37';
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(212,175,55,0)';
                }}
              >
                Crear mi plan
              </Link>
              <Link
                href="/plan-novios"
                className="inline-flex items-center justify-center font-medium text-sm rounded-full transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  backgroundColor: 'transparent',
                  color: '#f5ede3',
                  border: '1.5px solid rgba(245,237,227,0.30)',
                  padding: '11.5px 30px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#D4AF37';
                  e.currentTarget.style.color = '#D4AF37';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(245,237,227,0.30)';
                  e.currentTarget.style.color = '#f5ede3';
                }}
              >
                Cómo funciona
              </Link>
            </div>

            <p
              className="text-xs font-sans"
              style={{
                color: 'rgba(245,237,227,0.5)',
                letterSpacing: '0.04em',
              }}
            >
              ✦ Diseñado para parejas que valoran un comienzo consciente.
            </p>
          </motion.div>

          {/* ── Right: photo with offset gold frame ── */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 32 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-md"
          >
            {/* Decorative offset frame */}
            <motion.div
              aria-hidden="true"
              initial={{ clipPath: 'inset(0 100% 100% 0)', opacity: 0 }}
              animate={
                inView
                  ? { clipPath: 'inset(0 0 0 0)', opacity: 0.55 }
                  : { clipPath: 'inset(0 100% 100% 0)', opacity: 0 }
              }
              transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute pointer-events-none rounded-md"
              style={{
                top: '-16px',
                right: '-16px',
                bottom: '16px',
                left: '16px',
                border: '1.5px solid #D4AF37',
              }}
            />

            {/* Photo wrapper */}
            <div
              className="relative overflow-hidden rounded-md"
              style={{ aspectRatio: '4 / 5' }}
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt="Plan de Novios"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 90vw, 40vw"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(135deg, #7a6240 0%, #b89a73 45%, #9e7d5a 100%)',
                  }}
                />
              )}
              {/* Bottom darken */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent 60%, rgba(42,32,20,0.4) 100%)',
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

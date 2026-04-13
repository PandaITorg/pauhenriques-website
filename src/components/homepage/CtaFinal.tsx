'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { FaWhatsapp, FaInstagram, FaTiktok, FaSpotify } from 'react-icons/fa';

const WHATSAPP_PHONE = '593991712532';
const WHATSAPP_TEXT =
  'Hola Pau, vi tu sitio y me gustaría conocer más sobre cómo empezar un hogar libre de tóxicos.';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
  WHATSAPP_TEXT,
)}`;

const SOCIALS: Array<{
  href: string;
  Icon: typeof FaInstagram;
  label: string;
}> = [
  { href: 'https://www.instagram.com/pau_henriques/', Icon: FaInstagram, label: 'Instagram' },
  { href: 'https://www.tiktok.com/@pau_henriques', Icon: FaTiktok, label: 'TikTok' },
  {
    href: 'https://open.spotify.com/show/6eMZqxyHUtW46yJd0Et4uw',
    Icon: FaSpotify,
    label: 'Spotify',
  },
];

export default function CtaFinal() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.2 });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at center, var(--color-background) 0%, #181d12 100%)',
        paddingTop: 'clamp(96px, 12vw, 120px)',
        paddingBottom: 'clamp(96px, 12vw, 120px)',
      }}
    >
      {/* Botanical SVG watermark */}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="pointer-events-none absolute top-1/2 left-1/2 w-200 h-200 -translate-x-1/2 -translate-y-1/2 max-w-[90vw] max-h-[90vw]"
        style={{ opacity: 0.035 }}
      >
        <g fill="none" stroke="currentColor" strokeWidth="0.8" className="text-primary">
          <path d="M100 10 C 100 60, 100 140, 100 190" />
          <path d="M100 50 C 78 45, 60 38, 48 25" />
          <path d="M100 50 C 122 45, 140 38, 152 25" />
          <path d="M100 85 C 72 80, 50 68, 32 50" />
          <path d="M100 85 C 128 80, 150 68, 168 50" />
          <path d="M100 120 C 76 115, 58 103, 44 85" />
          <path d="M100 120 C 124 115, 142 103, 156 85" />
          <path d="M100 155 C 82 150, 68 140, 58 125" />
          <path d="M100 155 C 118 150, 132 140, 142 125" />
          <ellipse cx="100" cy="60" rx="22" ry="6" transform="rotate(-15 100 60)" />
          <ellipse cx="100" cy="60" rx="22" ry="6" transform="rotate(15 100 60)" />
          <ellipse cx="100" cy="100" rx="28" ry="7" transform="rotate(-15 100 100)" />
          <ellipse cx="100" cy="100" rx="28" ry="7" transform="rotate(15 100 100)" />
        </g>
      </svg>

      <div className="relative max-w-3xl mx-auto px-6 sm:px-8 flex flex-col items-center text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-cormorant font-medium leading-[1.15] text-white"
          style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}
        >
          Empieza tu hogar{' '}
          <span
            className="font-dancing-script italic"
            style={{
              color: 'var(--color-primary)',
              fontSize: '1.15em',
              fontWeight: 400,
            }}
          >
            sin tóxicos
          </span>{' '}
          hoy.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 font-cormorant italic leading-relaxed max-w-xl"
          style={{
            color: 'var(--color-text-main)',
            opacity: 0.7,
            fontSize: 'clamp(1.05rem, 1.5vw, 1.2rem)',
          }}
        >
          Conversa conmigo y te ayudo a dar el primer paso, pieza por pieza,
          sin abrumarte.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9 flex flex-wrap gap-4 items-center justify-center"
        >
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 font-medium rounded-full text-white animate-wa-pulse transition-all duration-200 hover:scale-[1.02] hover:brightness-110"
            style={{
              backgroundColor: '#25d366',
              padding: '16px 40px',
              fontSize: '1rem',
            }}
          >
            <FaWhatsapp className="w-5 h-5" />
            Habla conmigo por WhatsApp
          </a>

          <Link
            href="/tienda"
            className="inline-flex items-center justify-center font-medium text-base rounded-full transition-all duration-200 hover:-translate-y-0.5"
            style={{
              padding: '15px 40px',
              backgroundColor: 'transparent',
              color: 'var(--color-text-main)',
              border: '1.5px solid rgba(193,196,167,0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(193,196,167,0.06)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-main)';
            }}
          >
            Explorar tienda
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex items-center justify-center gap-3"
        >
          {SOCIALS.map(({ href, Icon, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5"
              style={{
                color: 'var(--color-text-main)',
                opacity: 0.5,
                border: '1px solid rgba(193,196,167,0.18)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.color = 'var(--color-primary)';
                e.currentTarget.style.borderColor = 'rgba(166,138,99,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.5';
                e.currentTarget.style.color = 'var(--color-text-main)';
                e.currentTarget.style.borderColor = 'rgba(193,196,167,0.18)';
              }}
            >
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

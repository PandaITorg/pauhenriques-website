'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

interface ImpactStatementProps {
  /** Optional big count-up number. Omit to render a typographic-only impact phrase. */
  number?: number;
  numberPrefix?: string;
  numberSuffix?: string;
  /** Short accent line rendered in Dancing Script above the main phrase. */
  kicker?: string;
  /** Main phrase in Cormorant italic. */
  phrase?: string;
  /** Optional supporting line below the phrase. */
  subphrase?: string;
}

const COUNT_DURATION_MS = 1800;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function ImpactStatement({
  number,
  numberPrefix = '+',
  numberSuffix = '',
  kicker = 'Toxic-Free',
  phrase = 'Hogares libres de tóxicos, familias que florecen.',
  subphrase,
}: ImpactStatementProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.25 });

  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!inView || number == null) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / COUNT_DURATION_MS);
      const eased = easeOutCubic(t);
      setDisplayed(Math.round(number * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, number]);

  // Scroll-driven parallax for the phrase and hairline scaleX
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const phraseY = useTransform(scrollYProgress, [0.15, 0.85], [16, -10]);
  const hairlineScale = useTransform(scrollYProgress, [0.15, 0.55], [0.3, 1]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{
        backgroundColor: 'var(--color-warm-900)',
        paddingTop: 'clamp(80px, 10vw, 120px)',
        paddingBottom: 'clamp(80px, 10vw, 120px)',
      }}
    >
      {/* Watermark SVG */}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="pointer-events-none absolute top-1/2 left-1/2 w-130 h-130 -translate-x-1/2 -translate-y-1/2"
        style={{ opacity: 0.045 }}
      >
        <g fill="none" stroke="currentColor" strokeWidth="1.2" className="text-primary">
          <path d="M100 20 C 100 60, 100 140, 100 180" />
          <path d="M100 60 C 80 55, 65 50, 55 40" />
          <path d="M100 60 C 120 55, 135 50, 145 40" />
          <path d="M100 95 C 75 90, 55 80, 40 65" />
          <path d="M100 95 C 125 90, 145 80, 160 65" />
          <path d="M100 130 C 80 125, 65 115, 55 100" />
          <path d="M100 130 C 120 125, 135 115, 145 100" />
        </g>
      </svg>

      {/* Top hairline */}
      <motion.div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 origin-center"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(164,172,133,0.35), transparent)',
          scaleX: hairlineScale,
        }}
      />

      <div className="relative max-w-3xl mx-auto px-6 text-center flex flex-col items-center">
        {/* Number (optional) */}
        {number != null && (
          <motion.div
            initial={{ opacity: 0, scale: 1.18 }}
            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.18 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="font-dancing-script font-bold leading-none"
            style={{
              color: '#D4AF37',
              fontSize: 'clamp(4rem, 8vw, 6rem)',
            }}
          >
            {numberPrefix}
            {displayed.toLocaleString('es-EC')}
            {numberSuffix}
          </motion.div>
        )}

        {/* Kicker (when there's no number, Dancing Script leads the composition) */}
        {number == null && kicker && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-dancing-script font-bold leading-none"
            style={{
              color: '#D4AF37',
              fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
            }}
          >
            {kicker}
          </motion.p>
        )}

        {/* Accent line */}
        <motion.div
          aria-hidden="true"
          initial={{ scaleX: 0.3, opacity: 0 }}
          animate={inView ? { scaleX: 1, opacity: 1 } : { scaleX: 0.3, opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="my-7 h-px w-24 origin-center"
          style={{ backgroundColor: 'var(--color-primary)' }}
        />

        {/* Main phrase */}
        <motion.p
          style={{
            y: phraseY,
            color: 'var(--color-text-main)',
            fontSize: number != null ? 'clamp(1.4rem, 2.5vw, 2rem)' : 'clamp(1.75rem, 3.5vw, 2.75rem)',
          }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="font-cormorant italic max-w-2xl leading-snug"
        >
          {phrase}
        </motion.p>

        {subphrase && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-xl leading-relaxed font-sans text-sm sm:text-base"
            style={{ color: 'var(--color-text-main)', opacity: 0.7 }}
          >
            {subphrase}
          </motion.p>
        )}
      </div>

      {/* Bottom hairline */}
      <motion.div
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-3/4 origin-center"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(164,172,133,0.35), transparent)',
          scaleX: hairlineScale,
        }}
      />
    </section>
  );
}

'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { HiChevronLeft, HiChevronRight, HiChevronDown } from 'react-icons/hi2';
import type {
  HeroSlide,
  HeroTitleFont,
  HeroTitleSize,
  HeroTextPosition,
  HeroTextBackground,
  HeroOverlayDirection,
  HeroImageEffect,
  HeroCtaStyle,
} from '@/lib/homepage/types';
import Hero from '@/components/home/Hero';

interface HeroCarouselProps {
  slides: HeroSlide[];
}

const AUTOPLAY_DELAY = 6000;

const MIN_H = 'min-h-[calc(100svh-4rem)] md:min-h-[calc(100svh-5rem)]';

const textVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.65, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  if (slides.length === 0) {
    return <Hero />;
  }
  return <CarouselInner slides={slides} />;
}

function CarouselInner({ slides }: { slides: HeroSlide[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  // Manual autoplay
  useEffect(() => {
    if (!emblaApi || isPaused || slides.length <= 1) return;
    const timer = setInterval(() => emblaApi.scrollNext(), AUTOPLAY_DELAY);
    return () => clearInterval(timer);
  }, [emblaApi, isPaused, slides.length]);

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {slides.map((slide, i) => (
            <div key={slide.id} className="relative flex-[0_0_100%] min-w-0">
              <SlideRenderer slide={slide} isActive={i === selectedIndex} />
            </div>
          ))}
        </div>
      </div>

      {/* Arrows — desktop only */}
      {slides.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/20 rounded-full items-center justify-center text-white transition-all duration-200 hover:scale-105 cursor-pointer"
            aria-label="Slide anterior"
          >
            <HiChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollNext}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/20 rounded-full items-center justify-center text-white transition-all duration-200 hover:scale-105 cursor-pointer"
            aria-label="Slide siguiente"
          >
            <HiChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-2.5 md:gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Ir al slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                i === selectedIndex
                  ? 'bg-white w-7 h-3 md:w-5 md:h-2'
                  : 'bg-white/40 hover:bg-white/70 w-3 h-3 md:w-2 md:h-2'
              }`}
            />
          ))}
        </div>
      )}

      {/* Chevron scroll indicator */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        style={{ animation: 'bounce 2s infinite' }}
      >
        <HiChevronDown className="w-6 h-6 text-white/40" />
      </div>
    </section>
  );
}

// ─── Style resolvers ─────────────────────────────────────────────────────────

export function resolveTitleClasses(font: HeroTitleFont, size: HeroTitleSize): string {
  const fontClass = {
    'cormorant': 'font-cormorant font-semibold',
    'cormorant-italic': 'font-cormorant italic font-medium',
    'dancing-script': 'font-dancing-script font-bold',
    'inter': 'font-sans font-bold tracking-tight',
  }[font];

  const sizeClass = {
    'md': 'text-3xl sm:text-4xl md:text-5xl',
    'lg': 'text-4xl sm:text-5xl md:text-6xl',
    'xl': 'text-5xl sm:text-6xl md:text-7xl',
    'xxl': 'text-6xl sm:text-7xl md:text-8xl',
  }[size];

  return `${fontClass} ${sizeClass} leading-[1.08]`;
}

export function resolvePositionClasses(position: HeroTextPosition): { container: string; inner: string } {
  const [vertical, horizontal] = position.split('-') as [string, string];
  const vClass = { top: 'justify-start pt-24 md:pt-20', center: 'justify-center', bottom: 'justify-end pb-24 md:pb-20' }[vertical] ?? '';
  const hClass = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  }[horizontal] ?? 'items-center text-center';

  return {
    container: `flex flex-col ${vClass} ${hClass}`,
    inner: '',
  };
}

export function resolveTextBackgroundClasses(bg: HeroTextBackground): string {
  switch (bg) {
    case 'opaque':
      return 'bg-black/55 rounded-2xl px-6 py-5 md:px-8 md:py-6';
    case 'glass':
      return 'backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-6 py-5 md:px-8 md:py-6';
    case 'spotlight':
      return 'px-6 py-5 md:px-8 md:py-6 [background:radial-gradient(ellipse_at_center,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.15)_55%,transparent_80%)]';
    case 'gradient-left':
    case 'gradient-bottom':
    case 'none':
    default:
      return '';
  }
}

export function resolveOverlayStyle(direction: HeroOverlayDirection, opacity: number): React.CSSProperties {
  const o = Math.max(0, Math.min(1, opacity ?? 0.5));
  const strong = Math.min(1, o + 0.2);
  const weak = o * 0.5;
  switch (direction) {
    case 'left':
      return { background: `linear-gradient(to right, rgba(0,0,0,${strong}) 0%, rgba(0,0,0,${weak}) 50%, rgba(0,0,0,0) 100%)` };
    case 'right':
      return { background: `linear-gradient(to left, rgba(0,0,0,${strong}) 0%, rgba(0,0,0,${weak}) 50%, rgba(0,0,0,0) 100%)` };
    case 'top':
      return { background: `linear-gradient(to bottom, rgba(0,0,0,${strong}) 0%, rgba(0,0,0,${weak}) 50%, rgba(0,0,0,0) 100%)` };
    case 'bottom':
      return { background: `linear-gradient(to top, rgba(0,0,0,${strong}) 0%, rgba(0,0,0,${weak}) 50%, rgba(0,0,0,0) 100%)` };
    case 'radial':
      return { background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,${o}) 100%)` };
    case 'vignette':
      return { background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,${strong}) 100%)` };
    case 'none':
    default:
      return { backgroundColor: `rgba(0,0,0,${o})` };
  }
}

export function resolveCtaClasses(style: HeroCtaStyle): string {
  const base = 'inline-flex items-center gap-2 font-semibold py-3 px-7 rounded-full transition-all duration-200 active:scale-[0.97]';
  switch (style) {
    case 'primary':
      return `${base} bg-primary hover:bg-primary-hover text-white`;
    case 'secondary':
      return `${base} bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white`;
    case 'ghost':
      return `${base} bg-transparent hover:bg-white/10 border border-white/40 hover:border-white text-white`;
    case 'gold':
      return `${base} bg-[#D4AF37] hover:bg-[#e8c96b] text-[#2a2014]`;
    case 'whatsapp':
      return `${base} bg-[#25d366] hover:bg-[#1ebe5c] text-white shadow-[0_8px_24px_rgba(37,211,102,0.3)]`;
    default:
      return `${base} bg-primary hover:bg-primary-hover text-white`;
  }
}

// ─── Title with accent word ──────────────────────────────────────────────────

function renderTitleWithAccent(title: string, accentWord: string) {
  if (!accentWord || !title.toLowerCase().includes(accentWord.toLowerCase())) {
    return title;
  }
  const idx = title.toLowerCase().indexOf(accentWord.toLowerCase());
  const before = title.slice(0, idx);
  const match = title.slice(idx, idx + accentWord.length);
  const after = title.slice(idx + accentWord.length);
  return (
    <>
      {before}
      <span className="font-dancing-script italic text-primary font-normal" style={{ fontSize: '1.1em' }}>
        {match}
      </span>
      {after}
    </>
  );
}

// ─── Slide image with effects ────────────────────────────────────────────────

function SlideMedia({ slide, isActive }: { slide: HeroSlide; isActive: boolean }) {
  const effect: HeroImageEffect = slide.imageEffect ?? 'ken-burns';
  const effectClass = effect === 'ken-burns' && isActive ? 'animate-ken-burns' : '';

  if (slide.videoUrl) {
    return (
      <video
        src={slide.videoUrl}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
    );
  }
  if (!slide.imageUrl) return null;

  return (
    <div className={`absolute inset-0 ${effectClass}`}>
      <Image
        src={slide.imageUrl}
        alt={slide.title || ''}
        fill
        className="object-cover"
        priority={isActive}
        sizes="100vw"
      />
    </div>
  );
}

// ─── Slide text block with stagger animations ───────────────────────────────

function SlideTextBlock({ slide, isActive }: { slide: HeroSlide; isActive: boolean }) {
  const font: HeroTitleFont = slide.titleFont ?? 'cormorant';
  const size: HeroTitleSize = slide.titleSize ?? 'lg';
  const bg: HeroTextBackground = slide.textBackground ?? 'gradient-left';
  const accent = slide.accentWord ?? '';
  const titleColor = slide.titleColor ?? '#ffffff';
  const bgClasses = resolveTextBackgroundClasses(bg);
  const titleClasses = resolveTitleClasses(font, size);

  return (
    <div className={`w-full max-w-xl ${bgClasses}`}>
      {slide.kicker && (
        <motion.p
          custom={0}
          initial="hidden"
          animate={isActive ? 'visible' : 'hidden'}
          variants={textVariants}
          className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-white/85 mb-3 [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]"
        >
          {slide.kicker}
        </motion.p>
      )}
      {slide.title && (
        <motion.h2
          custom={1}
          initial="hidden"
          animate={isActive ? 'visible' : 'hidden'}
          variants={textVariants}
          className={`${titleClasses} [text-shadow:0_2px_10px_rgba(0,0,0,0.45)]`}
          style={{ color: titleColor }}
        >
          {renderTitleWithAccent(slide.title, accent)}
        </motion.h2>
      )}
      {slide.subtitle && (
        <motion.p
          custom={2}
          initial="hidden"
          animate={isActive ? 'visible' : 'hidden'}
          variants={textVariants}
          className="mt-4 text-white/85 text-base sm:text-lg md:text-xl leading-relaxed max-w-lg [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]"
        >
          {slide.subtitle}
        </motion.p>
      )}
      {slide.ctaText && slide.ctaLink && (
        <motion.div
          custom={3}
          initial="hidden"
          animate={isActive ? 'visible' : 'hidden'}
          variants={textVariants}
          className="mt-7"
        >
          <Link href={slide.ctaLink} className={resolveCtaClasses(slide.ctaStyle ?? 'primary')}>
            {slide.ctaText}
          </Link>
        </motion.div>
      )}
    </div>
  );
}

// ─── Templates ───────────────────────────────────────────────────────────────

function SlideRenderer({ slide, isActive }: { slide: HeroSlide; isActive: boolean }) {
  const overlayStyle = resolveOverlayStyle(slide.overlayDirection ?? 'left', slide.overlayOpacity);

  if (slide.template === 'split') {
    const position = resolvePositionClasses(slide.textPosition ?? 'center-left');
    return (
      <div className={`${MIN_H} flex flex-col md:flex-row bg-background`}>
        <div className={`flex-1 p-8 md:p-12 lg:p-16 order-2 md:order-1 ${position.container}`}>
          <SlideTextBlock slide={slide} isActive={isActive} />
        </div>
        <div className="relative flex-1 min-h-[45svh] md:min-h-0 order-1 md:order-2 overflow-hidden">
          <SlideMedia slide={slide} isActive={isActive} />
          <div className="hidden md:block absolute inset-y-0 left-0 w-24 bg-linear-to-r from-background to-transparent pointer-events-none" />
        </div>
      </div>
    );
  }

  // full-image and immersive share the same structure (media + overlay + positioned text)
  const defaultPos: HeroTextPosition = slide.template === 'immersive' ? 'center' : 'bottom-left';
  const position = resolvePositionClasses(slide.textPosition ?? defaultPos);

  return (
    <div className={`relative ${MIN_H} overflow-hidden bg-background`}>
      <SlideMedia slide={slide} isActive={isActive} />
      <div className="absolute inset-0" style={overlayStyle} />
      <div className={`absolute inset-0 z-10 px-6 md:px-16 lg:px-24 ${position.container}`}>
        <SlideTextBlock slide={slide} isActive={isActive} />
      </div>
    </div>
  );
}

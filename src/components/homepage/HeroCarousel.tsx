'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { HiChevronLeft, HiChevronRight, HiChevronDown } from 'react-icons/hi2';
import type { HeroSlide } from '@/lib/homepage/types';
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

// ─── Text style wrapper ──────────────────────────────────────────────────────

function TextWrapper({
  textStyle,
  children,
}: {
  textStyle: HeroSlide['textStyle'];
  children: React.ReactNode;
}) {
  if (textStyle === 'opaque') {
    return (
      <div className="bg-black/55 rounded-2xl px-6 py-5 md:px-8 md:py-6">
        {children}
      </div>
    );
  }
  if (textStyle === 'glass') {
    return (
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-6 py-5 md:px-8 md:py-6">
        {children}
      </div>
    );
  }
  return <>{children}</>;
}

// ─── Slide text with stagger animations ─────────────────────────────────────

function SlideText({ slide, isActive }: { slide: HeroSlide; isActive: boolean }) {
  return (
    <TextWrapper textStyle={slide.textStyle}>
      {slide.title && (
        <motion.h2
          custom={0}
          initial="hidden"
          animate={isActive ? 'visible' : 'hidden'}
          variants={textVariants}
          className="font-cormorant font-semibold text-white text-4xl sm:text-5xl md:text-6xl leading-tight [text-shadow:0_2px_8px_rgba(0,0,0,0.5)]"
        >
          {slide.title}
        </motion.h2>
      )}
      {slide.subtitle && (
        <motion.p
          custom={1}
          initial="hidden"
          animate={isActive ? 'visible' : 'hidden'}
          variants={textVariants}
          className="mt-3 text-white/85 text-base sm:text-lg md:text-xl leading-relaxed max-w-lg"
        >
          {slide.subtitle}
        </motion.p>
      )}
      {slide.ctaText && slide.ctaLink && (
        <motion.div
          custom={2}
          initial="hidden"
          animate={isActive ? 'visible' : 'hidden'}
          variants={textVariants}
          className="mt-6"
        >
          <Link
            href={slide.ctaLink}
            className={`inline-flex items-center gap-2 font-semibold py-3 px-7 rounded-full transition-all duration-200 active:scale-[0.97] ${
              slide.ctaStyle === 'primary'
                ? 'bg-primary hover:bg-primary-hover text-white'
                : 'bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white'
            }`}
          >
            {slide.ctaText}
          </Link>
        </motion.div>
      )}
    </TextWrapper>
  );
}

// ─── Templates ───────────────────────────────────────────────────────────────

function SlideRenderer({ slide, isActive }: { slide: HeroSlide; isActive: boolean }) {
  if (slide.template === 'split') {
    return (
      <div className={`${MIN_H} flex flex-col md:flex-row bg-background`}>
        {/* Text column */}
        <div className="flex-1 flex items-center justify-center p-8 md:p-12 lg:p-16 order-2 md:order-1">
          <div className="w-full max-w-lg text-center md:text-left">
            <SlideText slide={slide} isActive={isActive} />
          </div>
        </div>
        {/* Image column */}
        <div className="relative flex-1 min-h-[45svh] md:min-h-0 order-1 md:order-2">
          {slide.imageUrl && (
            <Image
              src={slide.imageUrl}
              alt={slide.title || ''}
              fill
              className="object-cover"
              priority={isActive}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          )}
          {/* Gradient fade into text column on desktop */}
          <div className="hidden md:block absolute inset-y-0 left-0 w-24 bg-linear-to-r from-background to-transparent pointer-events-none" />
        </div>
      </div>
    );
  }

  if (slide.template === 'immersive') {
    return (
      <div className={`relative ${MIN_H} overflow-hidden bg-background flex items-center justify-center`}>
        {/* Video or image background */}
        {slide.videoUrl ? (
          <video
            src={slide.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : slide.imageUrl ? (
          <Image
            src={slide.imageUrl}
            alt={slide.title || ''}
            fill
            className="object-cover"
            priority={isActive}
            sizes="100vw"
          />
        ) : null}
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0,0,0,${slide.overlayOpacity})` }}
        />
        {/* Centered text */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pb-20 md:pb-16">
          <SlideText slide={slide} isActive={isActive} />
        </div>
      </div>
    );
  }

  // Default: full-image — gradient left→right
  return (
    <div className={`relative ${MIN_H} overflow-hidden bg-background`}>
      {slide.imageUrl && (
        <Image
          src={slide.imageUrl}
          alt={slide.title || ''}
          fill
          className="object-cover"
          priority={isActive}
          sizes="100vw"
        />
      )}
      {/* Gradient overlay left→right */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to right, rgba(0,0,0,${slide.overlayOpacity + 0.2}) 0%, rgba(0,0,0,${slide.overlayOpacity * 0.5}) 50%, rgba(0,0,0,0) 100%)`,
        }}
      />
      {/* Text left-aligned */}
      <div className="relative z-10 flex flex-col justify-end md:justify-center h-full px-6 md:px-16 lg:px-24 pb-24 md:pb-16 pt-8">
        <div className="w-full max-w-xl text-center md:text-left mx-auto md:mx-0">
          <SlideText slide={slide} isActive={isActive} />
        </div>
      </div>
    </div>
  );
}

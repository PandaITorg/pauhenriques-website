'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { HiChevronDown, HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import type { HeroSlide } from '@/lib/homepage/types';
import Hero from '@/components/home/Hero';
import MistDivider from '@/components/home/MistDivider';

const AUTOPLAY_DELAY = 6000;

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' as const } },
};

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  if (slides.length === 0) {
    return <Hero />;
  }
  return <HeroCarouselInner slides={slides} />;
}

function HeroCarouselInner({ slides }: { slides: HeroSlide[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  // Manual autoplay — resets whenever selectedIndex changes or hover state changes
  useEffect(() => {
    if (slides.length <= 1 || isHovered || !emblaApi) return;
    timerRef.current = setTimeout(() => emblaApi.scrollNext(), AUTOPLAY_DELAY);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [selectedIndex, isHovered, emblaApi, slides.length]);

  return (
    <section
      className="relative h-[calc(100svh-4rem)] md:h-[calc(100svh-5rem)] overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Embla viewport */}
      <div ref={emblaRef} className="absolute inset-0 overflow-hidden">
        <div className="flex h-full">
          {slides.map((slide, i) => (
            <div key={slide.id} className="flex-[0_0_100%] min-w-0 relative h-full">
              <SlideRenderer slide={slide} isActive={i === selectedIndex} />
            </div>
          ))}
        </div>
      </div>

      {/* Arrow navigation — desktop only */}
      {slides.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="hidden md:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white/80 hover:bg-black/50 hover:text-white transition-all cursor-pointer"
            aria-label="Slide anterior"
          >
            <HiChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollNext}
            className="hidden md:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white/80 hover:bg-black/50 hover:text-white transition-all cursor-pointer"
            aria-label="Siguiente slide"
          >
            <HiChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-20 md:bottom-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                i === selectedIndex
                  ? 'w-6 h-3 md:w-5 md:h-2 bg-white'
                  : 'w-3 h-3 md:w-2 md:h-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Ir al slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        animate={{ y: [0, 7, 0] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
      >
        <HiChevronDown className="w-6 h-6 text-white/50" />
      </motion.div>

      <MistDivider />
    </section>
  );
}

function SlideRenderer({ slide, isActive }: { slide: HeroSlide; isActive: boolean }) {
  if (slide.template === 'split') {
    return <SplitSlide slide={slide} isActive={isActive} />;
  }
  return <FullImageSlide slide={slide} isActive={isActive} />;
}

// ── Full-Image & Immersive templates ─────────────────────────────────────────

function FullImageSlide({ slide, isActive }: { slide: HeroSlide; isActive: boolean }) {
  const gradientOverlay =
    slide.template === 'full-image'
      ? `linear-gradient(to right, rgba(0,0,0,${slide.overlayOpacity}) 0%, rgba(0,0,0,${slide.overlayOpacity * 0.55}) 50%, transparent 100%)`
      : `rgba(0,0,0,${slide.overlayOpacity})`;

  return (
    <div className="absolute inset-0">
      {/* Background: video or image */}
      {slide.videoUrl && slide.template === 'immersive' ? (
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
          alt={slide.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 animated-gradient-bg" />
      )}

      {/* Directional overlay */}
      <div className="absolute inset-0" style={{ background: gradientOverlay }} />

      {/* Text content */}
      <div className="relative z-10 h-full flex items-end md:items-center">
        <div className="container mx-auto px-5 pb-28 md:pb-0 w-full">
          <div className="max-w-xl text-center md:text-left mx-auto md:mx-0">
            <AnimatePresence>
              {isActive && (
                <motion.div
                  key={slide.id}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <TextWrapper textStyle={slide.textStyle}>
                    <motion.h1
                      variants={itemVariants}
                      className="font-cormorant font-semibold text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight"
                    >
                      {slide.title}
                    </motion.h1>
                    {slide.subtitle && (
                      <motion.p
                        variants={itemVariants}
                        className="mt-4 text-white/80 text-lg sm:text-xl leading-relaxed"
                      >
                        {slide.subtitle}
                      </motion.p>
                    )}
                    {slide.ctaText && (
                      <motion.div variants={itemVariants} className="mt-8">
                        <CtaButton slide={slide} />
                      </motion.div>
                    )}
                  </TextWrapper>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Split template ────────────────────────────────────────────────────────────

function SplitSlide({ slide, isActive }: { slide: HeroSlide; isActive: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col md:flex-row">
      {/* Left: site gradient + text */}
      <div className="relative flex-1 md:w-1/2 flex items-end md:items-center animated-gradient-bg">
        <div
          className="absolute inset-0"
          style={{ background: `rgba(0,0,0,${slide.overlayOpacity * 0.25})` }}
        />
        <div className="relative z-10 w-full px-6 md:px-12 pb-10 md:pb-0 text-center md:text-left">
          <AnimatePresence>
            {isActive && (
              <motion.div
                key={slide.id}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <TextWrapper textStyle={slide.textStyle}>
                  <motion.h1
                    variants={itemVariants}
                    className="font-cormorant font-semibold text-text-main text-4xl sm:text-5xl md:text-6xl leading-tight"
                  >
                    {slide.title}
                  </motion.h1>
                  {slide.subtitle && (
                    <motion.p
                      variants={itemVariants}
                      className="mt-4 text-text-main/70 text-lg leading-relaxed"
                    >
                      {slide.subtitle}
                    </motion.p>
                  )}
                  {slide.ctaText && (
                    <motion.div variants={itemVariants} className="mt-8">
                      <CtaButton slide={slide} splitMode />
                    </motion.div>
                  )}
                </TextWrapper>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: image */}
      <div className="relative md:w-1/2 h-52 md:h-auto">
        {slide.imageUrl ? (
          <Image
            src={slide.imageUrl}
            alt={slide.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-surface-elevated" />
        )}
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function TextWrapper({
  children,
  textStyle,
}: {
  children: React.ReactNode;
  textStyle: HeroSlide['textStyle'];
}) {
  const styleMap: Record<HeroSlide['textStyle'], string> = {
    none: '',
    opaque: 'bg-background/50 px-4 py-3 rounded-xl inline-block',
    glass: 'backdrop-blur-md bg-black/20 border border-white/10 px-4 py-3 rounded-xl inline-block',
  };
  return <div className={styleMap[textStyle]}>{children}</div>;
}

function CtaButton({
  slide,
  splitMode = false,
}: {
  slide: HeroSlide;
  splitMode?: boolean;
}) {
  const primaryClass = splitMode
    ? 'bg-primary text-white hover:bg-primary-hover hover:shadow-[--shadow-glow-primary]'
    : 'bg-primary text-white hover:bg-primary-hover hover:shadow-[--shadow-glow-primary]';

  const secondaryClass = splitMode
    ? 'border-[1.5px] border-text-main/30 text-text-main hover:border-text-main/60 hover:bg-text-main/5'
    : 'border-[1.5px] border-white/50 text-white hover:border-white hover:bg-white/10';

  return (
    <Link
      href={slide.ctaLink}
      className={`inline-flex items-center gap-2 font-semibold py-3 px-8 rounded-full transition-all duration-200 active:scale-[0.97] ${
        slide.ctaStyle === 'primary' ? primaryClass : secondaryClass
      }`}
    >
      {slide.ctaText}
    </Link>
  );
}

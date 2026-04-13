'use client';

import Image from 'next/image';
import type { HeroSlide } from '@/lib/homepage/types';
import {
  resolveTitleClasses,
  resolvePositionClasses,
  resolveTextBackgroundClasses,
  resolveOverlayStyle,
  resolveCtaClasses,
} from './HeroCarousel';

interface SlidePreviewProps {
  slide: Omit<HeroSlide, 'id' | 'createdAt' | 'updatedAt'>;
  viewport: 'desktop' | 'mobile';
}

const DESKTOP_W = 1200;
const DESKTOP_H = 675;
const MOBILE_W = 375;
const MOBILE_H = 667;

function renderTitleWithAccent(title: string, accentWord: string) {
  if (!accentWord || !title.toLowerCase().includes(accentWord.toLowerCase())) {
    return title;
  }
  const idx = title.toLowerCase().indexOf(accentWord.toLowerCase());
  return (
    <>
      {title.slice(0, idx)}
      <span className="font-dancing-script italic text-primary font-normal" style={{ fontSize: '1.1em' }}>
        {title.slice(idx, idx + accentWord.length)}
      </span>
      {title.slice(idx + accentWord.length)}
    </>
  );
}

export default function SlidePreview({ slide, viewport }: SlidePreviewProps) {
  const isMobile = viewport === 'mobile';
  const w = isMobile ? MOBILE_W : DESKTOP_W;
  const h = isMobile ? MOBILE_H : DESKTOP_H;
  const imageSrc = isMobile && slide.imageMobile ? slide.imageMobile : slide.imageUrl;

  const titleFont = slide.titleFont ?? 'cormorant';
  const titleSize = slide.titleSize ?? 'lg';
  const textBackground = slide.textBackground ?? 'gradient-left';
  const textPosition = slide.textPosition ?? 'bottom-left';
  const overlayDirection = slide.overlayDirection ?? 'left';
  const titleColor = slide.titleColor ?? '#ffffff';

  const titleClasses = resolveTitleClasses(titleFont, titleSize);
  const positionClasses = resolvePositionClasses(textPosition);
  const bgClasses = resolveTextBackgroundClasses(textBackground);
  const overlayStyle = resolveOverlayStyle(overlayDirection, slide.overlayOpacity);

  return (
    <div
      className="relative bg-black overflow-hidden shadow-2xl rounded-lg"
      style={{ width: w, height: h }}
    >
      {/* Media */}
      {slide.videoUrl ? (
        <video src={slide.videoUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
      ) : imageSrc ? (
        <Image src={imageSrc} alt={slide.title || ''} fill className="object-cover" sizes={`${w}px`} unoptimized />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">Sin imagen</div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0" style={overlayStyle} />

      {/* Text block */}
      <div className={`absolute inset-0 z-10 ${isMobile ? 'px-5' : 'px-12 md:px-16'} ${positionClasses.container}`}>
        <div className={`${isMobile ? 'max-w-[90%]' : 'max-w-xl'} ${bgClasses}`}>
          {slide.kicker && (
            <p className={`font-sans font-semibold uppercase tracking-[0.2em] text-white/85 mb-2 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
              {slide.kicker}
            </p>
          )}
          {slide.title && (
            <h2 className={`${titleClasses} [text-shadow:0_2px_10px_rgba(0,0,0,0.45)]`} style={{ color: titleColor }}>
              {renderTitleWithAccent(slide.title, slide.accentWord ?? '')}
            </h2>
          )}
          {slide.subtitle && (
            <p className={`mt-3 text-white/85 leading-relaxed ${isMobile ? 'text-sm' : 'text-base md:text-lg'}`}>
              {slide.subtitle}
            </p>
          )}
          {slide.ctaText && (
            <div className="mt-5">
              <span className={resolveCtaClasses(slide.ctaStyle ?? 'primary')}>{slide.ctaText}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

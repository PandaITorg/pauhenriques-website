export type HeroTitleFont = 'cormorant' | 'cormorant-italic' | 'dancing-script' | 'inter';
export type HeroTitleSize = 'md' | 'lg' | 'xl' | 'xxl';
export type HeroTextPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';
export type HeroTextBackground = 'none' | 'glass' | 'opaque' | 'gradient-left' | 'gradient-bottom' | 'spotlight';
export type HeroOverlayDirection = 'none' | 'left' | 'right' | 'top' | 'bottom' | 'radial' | 'vignette';
export type HeroImageEffect = 'none' | 'ken-burns' | 'parallax';
export type HeroCtaStyle = 'primary' | 'secondary' | 'ghost' | 'gold' | 'whatsapp';

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imageMobile?: string;
  videoUrl?: string;
  ctaText: string;
  ctaLink: string;
  ctaStyle: HeroCtaStyle;
  template: 'full-image' | 'split' | 'immersive';
  /** @deprecated superseded by textBackground. Kept for legacy docs. */
  textStyle: 'none' | 'opaque' | 'glass';
  overlayOpacity: number;
  // Granular customization (all optional, defaults applied in getActiveSlides)
  kicker?: string;
  titleFont?: HeroTitleFont;
  titleSize?: HeroTitleSize;
  titleColor?: string;
  accentWord?: string;
  textPosition?: HeroTextPosition;
  textBackground?: HeroTextBackground;
  overlayDirection?: HeroOverlayDirection;
  imageEffect?: HeroImageEffect;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HomepageMetric {
  id: string;
  value: number;
  suffix: string;
  label: string;
  order: number;
  active: boolean;
}

export interface FeaturedProduct {
  id: string;
  name: string;
  shortDescription: string;
  price: number | null;
  comparePrice?: number;
  imageUrl: string;
  badge: string | null;
  ctaType: 'cart' | 'whatsapp' | 'link';
  ctaLink?: string;
  storeType: 'wellme' | 'carico';
  gridSpan?: 'normal' | 'wide' | 'tall';
  order: number;
  active: boolean;
}

export interface HomepageContent {
  // Plan de Novios
  novios_headline: string;
  novios_subheadline: string;
  novios_imageUrl: string;
  novios_ctaText: string;
  novios_ctaLink: string;
  // Podcast
  podcast_headline: string;
  podcast_subtitle: string;
  podcast_coverUrl: string;
  podcast_spotifyUrl: string;
  podcast_appleUrl: string;
  podcast_latestEpisodes: PodcastEpisode[];
  // About
  about_headline: string;
  about_text: string;
  about_imageUrl: string;
  about_ctaText: string;
  about_ctaLink: string;
  // CTA Final
  cta_final_headline: string;
  cta_final_subtitle: string;
  cta_final_whatsappUrl: string;
  cta_final_whatsappMessage: string;
  newsletter_active: boolean;
}

export interface PodcastEpisode {
  title: string;
  description: string;
  duration: string;
  date: string;
  spotifyLink: string;
}

export interface Testimonial {
  id: string;
  text: string;
  author: string;
  context: string;
  avatarUrl?: string;
  rating: number;
  featured: boolean;
  order: number;
}

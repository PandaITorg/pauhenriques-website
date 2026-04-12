export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imageMobile?: string;
  videoUrl?: string;
  ctaText: string;
  ctaLink: string;
  ctaStyle: 'primary' | 'secondary';
  template: 'full-image' | 'split' | 'immersive';
  textStyle: 'none' | 'opaque' | 'glass';
  overlayOpacity: number;
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

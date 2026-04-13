import { dbAdmin } from '@/lib/firebase-admin';
import { HeroSlide, HomepageMetric, FeaturedProduct, HomepageContent, Testimonial, HeroTextBackground } from './types';

function mapLegacyTextStyle(textStyle: string | undefined): HeroTextBackground {
  if (textStyle === 'glass') return 'glass';
  if (textStyle === 'opaque') return 'opaque';
  return 'gradient-left';
}

function applySlideDefaults(data: Record<string, unknown>): Partial<HeroSlide> {
  const legacyTextStyle = data.textStyle as string | undefined;
  return {
    kicker: (data.kicker as string) ?? '',
    titleFont: (data.titleFont as HeroSlide['titleFont']) ?? 'cormorant',
    titleSize: (data.titleSize as HeroSlide['titleSize']) ?? 'lg',
    titleColor: (data.titleColor as string) ?? '#ffffff',
    accentWord: (data.accentWord as string) ?? '',
    textPosition: (data.textPosition as HeroSlide['textPosition']) ?? 'bottom-left',
    textBackground: (data.textBackground as HeroSlide['textBackground']) ?? mapLegacyTextStyle(legacyTextStyle),
    overlayDirection: (data.overlayDirection as HeroSlide['overlayDirection']) ?? 'left',
    imageEffect: (data.imageEffect as HeroSlide['imageEffect']) ?? 'ken-burns',
  };
}

export async function getActiveSlides(): Promise<HeroSlide[]> {
  if (!dbAdmin) {
    console.warn('[hero_slides] dbAdmin not initialized — returning empty slides');
    return [];
  }
  try {
    const snapshot = await dbAdmin
      .collection('hero_slides')
      .where('active', '==', true)
      .orderBy('order')
      .get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        ...applySlideDefaults(data),
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
      } as HeroSlide;
    });
  } catch (e) {
    console.error('[hero_slides] query failed:', e);
    return [];
  }
}

export async function getActiveMetrics(): Promise<HomepageMetric[]> {
  // TODO: Implement Firestore query
  return [];
}

export async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  // TODO: Implement Firestore query
  return [];
}

export async function getHomepageContent(): Promise<HomepageContent | null> {
  // TODO: Implement Firestore query
  return null;
}

export async function getFeaturedTestimonials(): Promise<Testimonial[]> {
  // TODO: Implement Firestore query
  return [];
}

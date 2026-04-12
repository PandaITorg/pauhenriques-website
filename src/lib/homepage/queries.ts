import { dbAdmin } from '@/lib/firebase-admin';
import { HeroSlide, HomepageMetric, FeaturedProduct, HomepageContent, Testimonial } from './types';

export async function getActiveSlides(): Promise<HeroSlide[]> {
  if (!dbAdmin) return [];
  try {
    const snapshot = await dbAdmin
      .collection('homepage_slides')
      .where('active', '==', true)
      .orderBy('order', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title ?? '',
        subtitle: data.subtitle ?? '',
        imageUrl: data.imageUrl ?? '',
        imageMobile: data.imageMobile,
        videoUrl: data.videoUrl,
        ctaText: data.ctaText ?? '',
        ctaLink: data.ctaLink ?? '/',
        ctaStyle: data.ctaStyle ?? 'primary',
        template: data.template ?? 'full-image',
        textStyle: data.textStyle ?? 'none',
        overlayOpacity: data.overlayOpacity ?? 0.5,
        order: data.order ?? 0,
        active: data.active ?? true,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
      } as HeroSlide;
    });
  } catch {
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

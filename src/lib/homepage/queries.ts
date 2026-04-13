import { dbAdmin } from '@/lib/firebase-admin';
import { HeroSlide, HomepageMetric, FeaturedProduct, HomepageContent, Testimonial } from './types';

export async function getActiveSlides(): Promise<HeroSlide[]> {
  if (!dbAdmin) return [];
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

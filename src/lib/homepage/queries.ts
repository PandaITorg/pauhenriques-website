import { dbAdmin } from '@/lib/firebase-admin';
import { HeroSlide, HomepageMetric, FeaturedProduct, HomepageContent, Testimonial, HeroTextBackground, CaricoCategory } from './types';

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

export async function getFeaturedProducts(fallbackLimit = 8): Promise<FeaturedProduct[]> {
  if (!dbAdmin) {
    console.warn('[featured_products] dbAdmin not initialized — returning empty list');
    return [];
  }
  try {
    const refsSnapshot = await dbAdmin
      .collection('featured_products')
      .where('active', '==', true)
      .orderBy('order')
      .get();

    if (!refsSnapshot.empty) {
      const refs = refsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Array<{
        id: string;
        productId: string;
        badge?: string | null;
        bentoSize?: 'normal' | 'wide' | 'tall';
        order: number;
      }>;

      const productDocs = await Promise.all(
        refs.map((r) => dbAdmin!.collection('products').doc(r.productId).get()),
      );

      const merged: FeaturedProduct[] = [];
      refs.forEach((ref, i) => {
        const pDoc = productDocs[i];
        if (!pDoc.exists) return;
        const p = pDoc.data()!;
        if (p.isActive === false) return;
        merged.push({
          refId: ref.id,
          productId: ref.productId,
          name: p.name ?? '',
          description: p.description ?? '',
          price: typeof p.price === 'number' ? p.price : 0,
          imageUrl: Array.isArray(p.images) ? (p.images[0] ?? '') : '',
          badge: ref.badge ?? null,
          bentoSize: ref.bentoSize ?? 'normal',
          order: ref.order,
        });
      });
      if (merged.length > 0) return merged;
    }

    // Fallback: when no curation exists, surface the latest active Infrarrojo
    // products so the homepage never renders an empty Well Me grid.
    const fallbackSnapshot = await dbAdmin
      .collection('products')
      .where('productType', '==', 'Infrarrojo')
      .where('isActive', '==', true)
      .limit(fallbackLimit)
      .get();

    return fallbackSnapshot.docs.map((doc, i) => {
      const p = doc.data();
      return {
        refId: `fallback-${doc.id}`,
        productId: doc.id,
        name: p.name ?? '',
        description: p.description ?? '',
        price: typeof p.price === 'number' ? p.price : 0,
        imageUrl: Array.isArray(p.images) ? (p.images[0] ?? '') : '',
        badge: null,
        bentoSize: 'normal' as const,
        order: i,
      };
    });
  } catch (e) {
    console.error('[featured_products] query failed:', e);
    return [];
  }
}

export async function getActiveCaricoCategories(): Promise<CaricoCategory[]> {
  if (!dbAdmin) {
    console.warn('[carico_categories] dbAdmin not initialized — returning empty list');
    return [];
  }
  try {
    const snapshot = await dbAdmin
      .collection('carico_categories')
      .where('active', '==', true)
      .orderBy('order')
      .get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name ?? '',
        description: data.description ?? '',
        imageUrl: data.imageUrl ?? '',
        bgColor: data.bgColor ?? '#634d32',
        ctaLink: data.ctaLink ?? undefined,
        order: data.order ?? 0,
        active: data.active ?? true,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
      } as CaricoCategory;
    });
  } catch (e) {
    console.error('[carico_categories] query failed:', e);
    return [];
  }
}

export async function getHomepageContent(): Promise<HomepageContent | null> {
  // TODO: Implement Firestore query
  return null;
}

export async function getFeaturedTestimonials(): Promise<Testimonial[]> {
  // TODO: Implement Firestore query
  return [];
}

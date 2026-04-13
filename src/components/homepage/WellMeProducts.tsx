'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FaPlus } from 'react-icons/fa6';
import type { FeaturedProduct } from '@/lib/homepage/types';

interface WellMeProductsProps {
  products: FeaturedProduct[];
}

const SIZE_CLASSES: Record<FeaturedProduct['bentoSize'], string> = {
  normal: 'col-span-1 row-span-1 aspect-square',
  wide: 'col-span-2 row-span-1 aspect-[2/1]',
  tall: 'col-span-1 row-span-2 aspect-[1/2]',
};

export default function WellMeProducts({ products }: WellMeProductsProps) {
  return (
    <section
      className="py-16 md:py-24"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--color-primary)' }}
          >
            Tienda Well Me
          </p>
          <h2
            className="font-cormorant text-4xl md:text-5xl lg:text-6xl font-medium"
            style={{ color: 'var(--color-text-main)' }}
          >
            Tecnología infrarroja para tu bienestar diario
          </h2>
        </div>

        {products.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.75 auto-rows-[minmax(200px,auto)]">
            {products.map((product, i) => (
              <ProductCard key={product.refId} product={product} index={i} />
            ))}
          </div>
        )}

        {/* Section CTA */}
        <div className="flex justify-center mt-12 md:mt-16">
          <Link
            href="/tienda"
            className="inline-flex items-center gap-2 text-sm font-medium px-6 py-3 rounded-full border transition-all duration-200 hover:bg-white/5"
            style={{
              color: 'var(--color-text-main)',
              borderColor: 'rgba(193,196,167,0.3)',
            }}
          >
            Ver toda la tienda
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, index }: { product: FeaturedProduct; index: number }) {
  return (
    <motion.article
      className={`group relative overflow-hidden rounded-xl ${SIZE_CLASSES[product.bentoSize]}`}
      style={{ backgroundColor: 'var(--color-surface-card)' }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.08, 0.5) }}
    >
      <Link
        href={`/tienda/${product.productId}`}
        className="absolute inset-0 block"
        aria-label={`Ver ${product.name}`}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/30 text-xs">
            Sin imagen
          </div>
        )}

        {product.badge && (
          <span
            className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {product.badge}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 pt-16 pb-4 px-4 bg-linear-to-t from-black/85 via-black/55 to-transparent">
          <h3 className="font-cormorant text-lg md:text-xl font-medium text-white leading-tight line-clamp-2">
            {product.name}
          </h3>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p
              className="text-sm font-semibold"
              style={{ color: 'var(--color-primary)' }}
            >
              ${product.price.toFixed(2)}
            </p>
            <span
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <FaPlus className="w-2.5 h-2.5" />
              Ver
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-2xl p-16 text-center border"
      style={{
        backgroundColor: 'var(--color-surface-card)',
        borderColor: 'rgba(166,138,99,0.15)',
      }}
    >
      <p
        className="font-cormorant text-2xl mb-2"
        style={{ color: 'var(--color-text-main)' }}
      >
        Pronto en tienda
      </p>
      <p className="text-sm" style={{ color: 'var(--color-text-main)', opacity: 0.6 }}>
        Nuevos productos Well Me en camino.
      </p>
    </div>
  );
}

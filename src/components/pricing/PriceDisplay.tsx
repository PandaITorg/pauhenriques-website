import { getPriceDisplay } from "@/lib/pricing";

interface ProductLike {
  price: number;
  autoDiscounts?: unknown;
}

type DiscountForPricing = Parameters<typeof getPriceDisplay>[0]["autoDiscounts"];

interface PriceDisplayProps {
  product: ProductLike;
  /**
   * - "inline" → cards pequeñas (ProductCard, CompraCard). Precio + tachado en línea.
   * - "stacked" → detail pages. Label destacado arriba, precio grande, tachado visible.
   */
  variant?: "inline" | "stacked";
  /** Clase tailwind para el texto del precio final. Override del tamaño default. */
  priceClassName?: string;
  /** Color del precio final. Default: text-text-inverted (para cards blancas). */
  priceColorClassName?: string;
  /** Muestra el badge del label del descuento cuando aplica. Default: true. */
  showLabel?: boolean;
}

/**
 * Componente reusable que muestra el precio de un producto aplicando los
 * auto-discounts vigentes. Siempre muestra precios CON IVA (15%) ya que es
 * lo que el cliente paga y el estándar comercial en Ecuador.
 *
 * Si el producto tiene un descuento activo, renderiza:
 *   - Label del descuento (badge)
 *   - Precio base tachado
 *   - Precio final destacado
 *   - -XX% OFF
 *
 * Si no hay descuento, solo el precio final (= precio base).
 */
export default function PriceDisplay({
  product,
  variant = "inline",
  priceClassName,
  priceColorClassName = "text-text-inverted",
  showLabel = true,
}: PriceDisplayProps) {
  const display = getPriceDisplay({
    price: product.price,
    autoDiscounts: Array.isArray(product.autoDiscounts)
      ? (product.autoDiscounts as DiscountForPricing)
      : undefined,
  });

  if (variant === "stacked") {
    return (
      <div className="space-y-1.5">
        {display.hasActiveDiscount && display.label && showLabel && (
          <span className="inline-flex items-center gap-1 bg-primary/15 text-primary text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full">
            🔥 {display.label}
          </span>
        )}
        <div className="flex items-baseline gap-3 flex-wrap">
          <span
            className={`${priceClassName ?? "text-3xl font-bold"} ${priceColorClassName}`}
          >
            ${display.finalPrice.toFixed(2)}
          </span>
          {display.hasActiveDiscount && (
            <>
              <span className="text-base text-text-main/40 line-through">
                ${display.basePrice.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                -{display.percentOff}% OFF
              </span>
            </>
          )}
        </div>
      </div>
    );
  }

  // Inline variant (default — cards)
  return (
    <div className="space-y-0.5">
      {display.hasActiveDiscount && display.label && showLabel && (
        <p className="text-[10px] font-semibold tracking-wider uppercase text-primary leading-none">
          {display.label}
        </p>
      )}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span
          className={`${priceClassName ?? "text-lg font-bold"} ${priceColorClassName}`}
        >
          ${display.finalPrice.toFixed(2)}
        </span>
        {display.hasActiveDiscount && (
          <>
            <span className="text-xs text-text-inverted/40 line-through">
              ${display.basePrice.toFixed(2)}
            </span>
            <span className="text-[10px] font-bold text-success">
              -{display.percentOff}%
            </span>
          </>
        )}
      </div>
    </div>
  );
}

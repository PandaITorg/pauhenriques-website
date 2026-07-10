import { Timestamp } from "firebase/firestore";

export type ProductType = "WellMe" | "Carico";

/**
 * Descuento automático (sin código de cupón) programado por fecha.
 * `finalPrice` es el precio CON IVA que paga el cliente durante la
 * ventana activa. `validUntil` puede ser null = descuento permanente.
 *
 * Cuando hay varios, se aplica el primero cuyo validUntil >= now
 * una vez ordenados cronológicamente (ver getPriceDisplay).
 */
export interface AutoDiscount {
  finalPrice: number;
  label: string;
  validUntil: Timestamp | null;
}

export interface BaseProduct {
  id: string;
  name: string;
  description: string;
  brand: string;
  images: string[];
  category: string;
  productType: ProductType;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Extended fields from product catalog
  material?: string | null;
  color?: string | null;
  weight?: string | null;
  dimensions?: string | null;
  voltage?: string | null;
  power?: string | null;
  warranty?: string | null;
  manufacturer?: string | null;
  parentCategory?: string;
  subCategory?: string | null;
  tags?: string[];
  /**
   * Cuando es true, el producto NO aparece en /tienda ni en ninguna vista de
   * catálogo pública. Sigue siendo accesible por ID para flujos específicos
   * (por ejemplo productos digitales vendidos vía link de pago dedicado).
   */
  hiddenFromCatalog?: boolean;
  /** Posición en la grilla de la tienda. Menor = primero. Default 0 (aditivo). */
  sortOrder?: number;
  /**
   * Descuentos automáticos programados (sin cupón). Ver AutoDiscount y
   * getPriceDisplay() en @/lib/pricing.
   */
  autoDiscounts?: AutoDiscount[];
}

export interface WellMeProduct extends BaseProduct {
  productType: "WellMe";
  price: number;
  stock: number;
  variants?: Array<{
    name: string;
    sku: string;
    price: number;
    stock: number;
  }>;
}

export interface CaricoProduct extends BaseProduct {
  productType: "Carico";
  consultationWhatsapp: string;
  consultationPrice?: number;
}

export type Product = WellMeProduct | CaricoProduct;

export function isWellMeProduct(
  product: Product,
): product is WellMeProduct {
  return product.productType === "WellMe";
}

export function isCaricoProduct(product: Product): product is CaricoProduct {
  return product.productType === "Carico";
}

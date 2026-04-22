import { Timestamp } from "firebase/firestore";

export type ProductType = "Infrarrojo" | "Carico";

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
}

export interface InfrrarrojoProduct extends BaseProduct {
  productType: "Infrarrojo";
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

export type Product = InfrrarrojoProduct | CaricoProduct;

export function isInfrrarrojoProduct(
  product: Product,
): product is InfrrarrojoProduct {
  return product.productType === "Infrarrojo";
}

export function isCaricoProduct(product: Product): product is CaricoProduct {
  return product.productType === "Carico";
}

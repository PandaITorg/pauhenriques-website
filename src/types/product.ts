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
}

export interface InfrrarrojoProduct extends BaseProduct {
  productType: "Infrarrojo";
  price: number;
  stock: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
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

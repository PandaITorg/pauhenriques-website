import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, ProductType } from "@/types/product";

export class ProductService {
  private db: typeof db;
  private productsCollection: string;

  constructor(firestore?: typeof db) {
    this.db = firestore || db;
    this.productsCollection = "products";
  }

  private mapDoc(docSnap: any): Product {
    return { id: docSnap.id, ...docSnap.data() } as Product;
  }

  async getAllProducts(): Promise<Product[]> {
    const q = query(
      collection(this.db, this.productsCollection),
      where("isActive", "==", true),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(this.mapDoc);
  }

  async getProductsByType(type: ProductType): Promise<Product[]> {
    const q = query(
      collection(this.db, this.productsCollection),
      where("productType", "==", type),
      where("isActive", "==", true),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(this.mapDoc);
  }

  async getProductById(id: string): Promise<Product | null> {
    const docRef = doc(this.db, this.productsCollection, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return this.mapDoc(docSnap);
  }

  async getProductsByCategory(parentCategory: string): Promise<Product[]> {
    const q = query(
      collection(this.db, this.productsCollection),
      where("parentCategory", "==", parentCategory),
      where("isActive", "==", true),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(this.mapDoc);
  }

  async searchProducts(term: string): Promise<Product[]> {
    // Firestore has no full-text search, so we fetch all and filter client-side
    const all = await this.getAllProducts();
    const lower = term.toLowerCase();
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower) ||
        p.brand.toLowerCase().includes(lower) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(lower))),
    );
  }
}

export const productService = new ProductService();

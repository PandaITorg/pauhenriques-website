import {
  collection,
  query,
  where,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, ProductType } from "@/types/product";

export class ProductService {
  private db: typeof db;
  private productsCollection: string;

  constructor(firestore?: typeof db) {
    this.db = firestore || db;
    this.productsCollection = "productos";
  }

  async getProductsByType(type: ProductType): Promise<Product[]> {
    const q = query(
      collection(this.db, this.productsCollection),
      where("productType", "==", type),
      where("isActive", "==", true),
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as Product;
    });
  }

  async getAllProducts(): Promise<Product[]> {
    const q = query(
      collection(this.db, this.productsCollection),
      where("isActive", "==", true),
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as Product;
    });
  }

  async getProductById(id: string): Promise<Product | null> {
    // Implementation for fetching a single product by ID
    // You'll need to add this method
    return null;
  }
}

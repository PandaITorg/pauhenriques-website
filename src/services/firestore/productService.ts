import {
  collection,
  query,
  where,
  getDocs,
  getFirestore,
  Firestore,
} from "firebase/firestore";
import { Product, ProductType } from "@/types/product";

export class ProductService {
  private db: Firestore;
  private productsCollection: string;

  constructor(firestore?: Firestore) {
    this.db = firestore || getFirestore();
    this.productsCollection = "productos";
  }

  async getProductsByType(type: ProductType): Promise<Product[]> {
    const q = query(
      collection(this.db, this.productsCollection),
      where("productType", "==", type),
      where("isActive", "==", true),
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Product,
    );
  }

  async getAllProducts(): Promise<Product[]> {
    const q = query(
      collection(this.db, this.productsCollection),
      where("isActive", "==", true),
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Product,
    );
  }

  async getProductById(id: string): Promise<Product | null> {
    // Implementation for fetching a single product by ID
    // You'll need to add this method
    return null;
  }
}

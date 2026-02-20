import * as admin from "firebase-admin";
import * as fs from "fs";
import csv from "csv-parser";

// Initialize Firebase Admin (you'll need to set up service account)
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const firestore = admin.firestore();

interface ProductRow {
  product_type: "Infrarrojo" | "Carico";
  product_id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  stock_quantity: string;
  images: string;
  consultation_whatsapp: string;
  is_active: string;
  brand: string;
}

// Define base product interface
interface BaseProduct {
  id: string;
  name: string;
  description: string;
  brand: string;
  images: string[];
  category: string;
  productType: "Infrarrojo" | "Carico";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define specific product interfaces
interface InfrrarrojoProduct extends BaseProduct {
  productType: "Infrarrojo";
  price: number;
  stock: number;
  variants?: any[]; // Optional: Add more specific type if needed
}

interface CaricoProduct extends BaseProduct {
  productType: "Carico";
  consultationWhatsapp: string;
  consultationPrice?: number;
}

async function importProducts(csvFilePath: string) {
  const products: Array<InfrrarrojoProduct | CaricoProduct> = [];

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (row: ProductRow) => {
      const baseProduct = {
        id: row.product_id,
        name: row.name,
        description: row.description,
        brand: row.brand || "Wellme",
        images: row.images
          .split(";")
          .map((img) => `/images/products/${img.trim()}`),
        category: row.category,
        productType: row.product_type,
        isActive: row.is_active.toLowerCase() === "true",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (row.product_type === "Infrarrojo") {
        const product: InfrrarrojoProduct = {
          ...baseProduct,
          productType: "Infrarrojo",
          price: parseFloat(row.price),
          stock: parseInt(row.stock_quantity, 10),
          variants: [], // Optional: Add variant logic if needed
        };
        products.push(product);
      } else {
        const product: CaricoProduct = {
          ...baseProduct,
          productType: "Carico",
          consultationWhatsapp: row.consultation_whatsapp,
          consultationPrice: row.price ? parseFloat(row.price) : undefined,
        };
        products.push(product);
      }
    })
    .on("end", async () => {
      const batch = firestore.batch();

      products.forEach((product) => {
        const docRef = firestore.collection("productos").doc(product.id);
        batch.set(docRef, product);
      });

      try {
        await batch.commit();
        console.log(`Successfully imported ${products.length} products`);
      } catch (error) {
        console.error("Error importing products:", error);
      }
    });
}

// Usage
importProducts("./products.csv");

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as fs from "fs";
import * as dotenv from "dotenv";
import csv from "csv-parser";

dotenv.config({ path: ".env.local" });

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const firestore = getFirestore();

interface CsvRow {
  product_id: string;
  brand: string;
  name: string;
  detalles: string;
  descripcion: string;
  material: string;
  color: string;
  peso: string;
  price: string;
  dimensiones: string;
  voltaje: string;
  potencia: string;
  garantia: string;
  fabricante: string;
  categoria_padre: string;
  sub_categoria: string;
  tags: string;
}

const WHATSAPP_NUMBER = "593991712532";

async function importProducts(csvFilePath: string) {
  const products: Record<string, unknown>[] = [];

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (row: CsvRow) => {
      const isWellMe = row.brand.toLowerCase() === "well me";
      const price = row.price ? parseFloat(row.price) : undefined;

      const whatsappMsg = encodeURIComponent(
        `Hola Pau, quiero conocer más sobre el producto "${row.name}".`
      );

      const product: Record<string, unknown> = {
        name: row.name,
        description: row.detalles || row.descripcion,
        brand: row.brand,
        images: [],
        category: row.sub_categoria || row.categoria_padre,
        productType: isWellMe ? "WellMe" : "Carico",
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        material: row.material || null,
        color: row.color || null,
        weight: row.peso || null,
        dimensions: row.dimensiones || null,
        voltage: row.voltaje || null,
        power: row.potencia || null,
        warranty: row.garantia || null,
        manufacturer: row.fabricante || null,
        parentCategory: row.categoria_padre,
        subCategory: row.sub_categoria || null,
        tags: row.tags ? row.tags.split(",").map((t) => t.trim()) : [],
      };

      if (isWellMe) {
        product.price = price || 0;
        product.stock = 0;
      } else {
        product.consultationWhatsapp = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${whatsappMsg}`;
        if (price) product.consultationPrice = price;
      }

      products.push(product);
    })
    .on("end", async () => {
      console.log(`Parsed ${products.length} products from CSV`);

      const batchSize = 500;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = firestore.batch();
        const chunk = products.slice(i, i + batchSize);

        chunk.forEach((product) => {
          const docRef = firestore.collection("products").doc();
          product.id = docRef.id;
          batch.set(docRef, product);
        });

        try {
          await batch.commit();
          console.log(
            `Batch ${Math.floor(i / batchSize) + 1}: uploaded ${chunk.length} products`
          );
        } catch (error) {
          console.error(`Error in batch ${Math.floor(i / batchSize) + 1}:`, error);
        }
      }

      console.log("Import complete!");
    });
}

const csvPath = process.argv[2] || "./productos_consolidados_estandarizados.csv";
importProducts(csvPath);

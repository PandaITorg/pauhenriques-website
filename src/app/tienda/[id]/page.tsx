import { notFound, redirect } from "next/navigation";
import { dbAdmin } from "@/lib/firebase-admin";
import ProductDetailClient from "./ProductDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Productos ocultos del catálogo que tienen su propio flow de venta.
// Cuando alguien abre /tienda/<id> directamente, en vez de exponer la
// página de detalle con botón "Agregar al carrito" lo mandamos al
// flow correcto.
const HIDDEN_PRODUCT_REDIRECTS: Record<string, string> = {
  "curso-toxica-sin-toxicos": "/pago/toxica-sin-toxicos",
};

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;

  // Gate server-side: si el producto está marcado hiddenFromCatalog,
  // redirigir al flow dedicado o 404. Fail-open si Firestore Admin
  // no está disponible para no romper páginas legítimas.
  if (dbAdmin) {
    try {
      const doc = await dbAdmin.collection("products").doc(id).get();
      if (doc.exists && doc.data()?.hiddenFromCatalog === true) {
        const target = HIDDEN_PRODUCT_REDIRECTS[id];
        if (target) redirect(target);
        notFound();
      }
    } catch (err) {
      console.error("[tienda/[id]] hiddenFromCatalog check failed:", err);
    }
  }

  return <ProductDetailClient productId={id} />;
}

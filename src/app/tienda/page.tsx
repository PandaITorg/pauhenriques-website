import type { Metadata } from "next";
import TiendaClient from "./page_client";

export const metadata: Metadata = {
  title: "Tienda | Pau Henriques - Productos para una Vida Saludable",
  description:
    "Próximamente: una selección exclusiva de productos para un estilo de vida sin tóxicos. Suscríbete para ser el primero en saber de nuestra gran apertura.",
  alternates: {
    canonical: "https://www.pauhenriques.com/tienda",
  },
};

export default function TiendaPage() {
  return <TiendaClient />;
}

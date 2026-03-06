import type { Metadata } from "next";
import TiendaClient from "./page_client";

export const metadata: Metadata = {
  title: "Tienda | Pau Henriques - Productos para una Vida sin Toxicos",
  description:
    "Descubre productos para una vida sin toxicos. Ollas de acero quirurgico, purificadores de agua y aire, sistemas de descanso Earthing y mas.",
  alternates: {
    canonical: "https://www.pauhenriques.com/tienda",
  },
};

export default function TiendaPage() {
  return <TiendaClient />;
}

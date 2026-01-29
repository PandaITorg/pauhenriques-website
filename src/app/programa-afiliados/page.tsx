import ProgramaAfiliadosClient from "./ProgramaAfiliadosClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programa de Afiliados - Pau Henriques",
  description:
    "Únete a nuestro equipo y promueve un estilo de vida saludable y sin tóxicos. Obtén comisiones por cada venta.",
  alternates: {
    canonical: "https://www.pauhenriques.com/programa-afiliados",
  },
};

export default function ProgramaAfiliadosPage() {
  return <ProgramaAfiliadosClient />;
}

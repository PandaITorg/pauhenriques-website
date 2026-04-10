import PlanNoviosClient from "./PlanNoviosClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan Novios Carico - Pau Henriques",
  description:
    "El regalo de bodas que se transforma en salud y bienestar para tu nuevo hogar. Los invitados aportan, los novios eligen productos Carico a precios especiales.",
  alternates: {
    canonical: "https://www.pauhenriques.com/plan-novios",
  },
};

export default function PlanNoviosPage() {
  return <PlanNoviosClient />;
}

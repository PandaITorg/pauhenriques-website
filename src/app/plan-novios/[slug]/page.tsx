import ContributeClient from "./ContributeClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contribuir al Plan Novios - Pau Henriques",
  description:
    "Haz tu contribucion al Plan Novios Carico. Aporta el monto que desees como regalo de bodas.",
};

export default function ContributePage() {
  return <ContributeClient />;
}

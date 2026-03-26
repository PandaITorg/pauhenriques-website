import pauSobreMi1 from "@/assets/pau-sobre-mi-1.jpg";
import pauSobreMi2 from "@/assets/pau-sobre-mi-2.jpg";
import SobreMiSchema from "@/components/schemas/SobreMiSchema";
import SobreMiClient from "./SobreMiClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre Mi | Pau Henriques - Mi Historia de Sanacion y Bienestar",
  description:
    "Conoce mi historia con la psoriasis y como transforme mi vida a traves de una alimentacion saludable y un estilo de vida sin toxicos. Te ayudo a sanar tu cuerpo de forma natural.",
  alternates: {
    canonical: "https://www.pauhenriques.com/sobre-mi",
  },
};

export default function SobreMi() {
  return (
    <>
      <SobreMiSchema />
      <SobreMiClient
        pauSobreMi1={pauSobreMi1}
        pauSobreMi2={pauSobreMi2}
      />
    </>
  );
}

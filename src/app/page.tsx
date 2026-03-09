import HomeSchema from "@/components/schemas/HomeSchema";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import SobreMi from "@/components/home/SobreMi";
import CategoryShowcase from "@/components/home/CategoryShowcase";
import PodcastSection from "@/components/home/PodcastSection";
import Testimonios from "@/components/home/Testimonios";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pau Henriques - Salud Integral, Bienestar y Vida Sin Tóxicos",
  description:
    "Transforma tu vida con Pau Henriques. Descubre cómo sanar tu cuerpo, vivir sin tóxicos y alcanzar un bienestar integral. Conoce mi historia, mi podcast y mis productos.",
  alternates: {
    canonical: "https://www.pauhenriques.com/",
  },
};

export default function Home() {
  return (
    <>
      <HomeSchema />
      <div className="overflow-x-hidden">
        <Hero />
        <SobreMi />
        <CategoryShowcase />
        <PodcastSection />
        <Testimonios />
        <Footer />
      </div>
    </>
  );
}

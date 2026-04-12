import HomeSchema from "@/components/schemas/HomeSchema";
import Footer from "@/components/layout/Footer";
import HeroCarousel from "@/components/homepage/HeroCarousel";
import SobreMi from "@/components/home/SobreMi";
import CategoryShowcase from "@/components/home/CategoryShowcase";
import PodcastSection from "@/components/home/PodcastSection";
import Testimonios from "@/components/home/Testimonios";
import { getActiveSlides } from "@/lib/homepage/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pau Henriques - Salud Integral, Bienestar y Vida Sin Tóxicos",
  description:
    "Transforma tu vida con Pau Henriques. Descubre cómo sanar tu cuerpo, vivir sin tóxicos y alcanzar un bienestar integral. Conoce mi historia, mi podcast y mis productos.",
  alternates: {
    canonical: "https://www.pauhenriques.com/",
  },
};

export default async function Home() {
  const slides = await getActiveSlides();

  return (
    <>
      <HomeSchema />
      <div className="overflow-x-hidden">
        <HeroCarousel slides={slides} />
        <SobreMi />
        <CategoryShowcase />
        <PodcastSection />
        <Testimonios />
        <Footer />
      </div>
    </>
  );
}

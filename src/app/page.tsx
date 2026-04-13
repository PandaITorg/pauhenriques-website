import HomeSchema from "@/components/schemas/HomeSchema";
import Footer from "@/components/layout/Footer";
import SobreMi from "@/components/home/SobreMi";
import CategoryShowcase from "@/components/home/CategoryShowcase";
import PodcastSection from "@/components/home/PodcastSection";
import Testimonios from "@/components/home/Testimonios";
import HeroCarousel from "@/components/homepage/HeroCarousel";
import ImpactStatement from "@/components/homepage/ImpactStatement";
import CaricoShowcase from "@/components/homepage/CaricoShowcase";
import WellMeProducts from "@/components/homepage/WellMeProducts";
import {
  getActiveSlides,
  getActiveCaricoCategories,
  getFeaturedProducts,
} from "@/lib/homepage/queries";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pau Henriques - Salud Integral, Bienestar y Vida Sin Tóxicos",
  description:
    "Transforma tu vida con Pau Henriques. Descubre cómo sanar tu cuerpo, vivir sin tóxicos y alcanzar un bienestar integral. Conoce mi historia, mi podcast y mis productos.",
  alternates: {
    canonical: "https://www.pauhenriques.com/",
  },
};

export default async function Home() {
  const [slides, caricoCategories, featuredProducts] = await Promise.all([
    getActiveSlides(),
    getActiveCaricoCategories(),
    getFeaturedProducts(),
  ]);

  return (
    <>
      <HomeSchema />
      <div className="overflow-x-hidden">
        <HeroCarousel slides={slides} />
        <ImpactStatement />
        <SobreMi />
        <CategoryShowcase />
        <CaricoShowcase categories={caricoCategories} />
        <WellMeProducts products={featuredProducts} />
        <PodcastSection />
        <Testimonios />
        <Footer />
      </div>
    </>
  );
}

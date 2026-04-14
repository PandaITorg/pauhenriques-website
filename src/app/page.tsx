import HomeSchema from "@/components/schemas/HomeSchema";
import Footer from "@/components/layout/Footer";
import Testimonios from "@/components/home/Testimonios";
import HeroCarousel from "@/components/homepage/HeroCarousel";
import ImpactStatement from "@/components/homepage/ImpactStatement";
import CaricoShowcase from "@/components/homepage/CaricoShowcase";
import WellMeProducts from "@/components/homepage/WellMeProducts";
import PlanNoviosSection from "@/components/homepage/PlanNoviosSection";
import PodcastSection from "@/components/homepage/PodcastSection";
import CtaFinal from "@/components/homepage/CtaFinal";
import {
  getActiveSlides,
  getActiveCaricoCategories,
  getFeaturedProducts,
} from "@/lib/homepage/queries";
import { getLatestEpisodes } from "@/lib/homepage/podcast";
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
  const [slides, caricoCategories, featuredProducts, podcastEpisodes] = await Promise.all([
    getActiveSlides(),
    getActiveCaricoCategories(),
    getFeaturedProducts(),
    getLatestEpisodes(3),
  ]);

  return (
    <>
      <HomeSchema />
      <div className="overflow-x-hidden">
        <HeroCarousel slides={slides} />
        <ImpactStatement />
        <CaricoShowcase categories={caricoCategories} />
        <WellMeProducts products={featuredProducts} />
        <PlanNoviosSection imageUrl="https://firebasestorage.googleapis.com/v0/b/pau-henriques-web-v1.firebasestorage.app/o/public-assets%2Fplan-novios%2Fproducto-portrait.webp?alt=media" />
        <PodcastSection episodes={podcastEpisodes ?? undefined} />
        <Testimonios />
        <CtaFinal />
        <Footer />
      </div>
    </>
  );
}

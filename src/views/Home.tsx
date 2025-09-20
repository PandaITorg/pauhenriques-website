import Testimonios from "../components/Testimonios";
import ProductVideos from "../components/ProductVideos";
import HomeSchema from "../components/HomeSchema";
import Footer from "../components/Footer";
import Hero from "../components/home/Hero";
import SobreMi from "../components/home/SobreMi";
import PodcastSection from "../components/home/PodcastSection";

export default function Home() {
  return (
    <>
      <HomeSchema />
      <div className="overflow-x-hidden h-full">
        <Hero />
        <SobreMi />
        <ProductVideos />
        <PodcastSection />
        <Testimonios />
        <Footer />
      </div>
    </>
  );
}

import { FaSpotify, FaApple } from "react-icons/fa";
import podcastCover from "@/assets/de-toxica-a-sin-toxicos.webp";
import PodcastSchema from "@/components/schemas/PodcastSchema";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: 'Podcast "De Toxica a Sin Toxicos" | Pau Henriques',
  description:
    "Escucha los episodios del podcast de Pau Henriques sobre bienestar, salud natural y desarrollo personal. Inspiracion y herramientas practicas para una vida plena y sin toxicos.",
  alternates: {
    canonical: "https://www.pauhenriques.com/podcast",
  },
};

const episodes = [
  {
    id: 1,
    number: "11",
    title: "MI EXPERIENCIA FAMILIAR CON EL EARTHING",
    description:
      "En este episodio te cuento como el sistema de descanso con conexion a tierra ha ayudado a mi familia en su descanso. Es un testimonio personal que la crisis de sueno que existian en mi familia y que gracias al Earthing lo hemos superado.",
    spotifyLink:
      "https://open.spotify.com/episode/6eMZqxyHUtW46yJd0Et4uw",
    applePodcastLink:
      "https://podcasts.apple.com/us/podcast/de-t%C3%B3xica-a-sin-t%C3%B3xicos/id1567244331",
  },
  {
    id: 2,
    number: "10",
    title: "EL VENENO SILENCIOSO QUE TE ESTAS COMIENDO TODOS LOS DIAS",
    description:
      "En esta ocasion mi esposo me va a acompanar ya que es un tema un poco espeso. Luego de mucha investigacion tengo informacion que te va a convencer al 100% de ir a tu cocina y botar todas las sartenes y ollas de teflon.",
    spotifyLink:
      "https://open.spotify.com/episode/5R0eOglaAltHGjnenJHK1C",
    applePodcastLink:
      "https://podcasts.apple.com/us/podcast/episodio-10-el-veneno-silencioso-que-te-est%C3%A1s/id1567244331?i=1000533922680",
  },
  {
    id: 3,
    number: "09",
    title: "CONOCE LOS BIORRITMOS DE TU CUERPO Y APLICALOS A TU FAVOR",
    description:
      "En este episodio te cuento sobre los biorritmos del cuerpo, cuantos tenemos y como utilizarlos a nuestro favor para tener una mejor digestion, tener mas energia y si nuestra meta es bajar de peso.",
    spotifyLink:
      "https://open.spotify.com/episode/0228CedbhkVhM6E9g4xG8C",
    applePodcastLink:
      "https://podcasts.apple.com/us/podcast/episodio-9-conoce-los-biorritmos-de-tu-cuerpo-y/id1567244331?i=1000530979938",
  },
];

export default function Podcast() {
  return (
    <>
      <PodcastSchema episodes={episodes} />
      <div className="bg-background min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Subtle warm gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-b from-warm-950/60 via-background to-background" />

          <div className="relative max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-20 md:pb-24">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-14">
              {/* Cover art */}
              <div className="w-full max-w-[280px] md:max-w-xs shrink-0">
                <div className="relative group">
                  <div className="rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:-rotate-1 group-hover:scale-[1.02]">
                    <Image
                      src={podcastCover}
                      alt="De Toxica a Sin Toxicos Podcast Cover"
                      width={640}
                      height={640}
                      className="w-full h-auto"
                      priority
                    />
                  </div>
                  {/* Glow */}
                  <div className="absolute -inset-6 bg-primary/8 rounded-3xl blur-3xl -z-10" />
                </div>
              </div>

              {/* Info */}
              <div className="text-center md:text-left">
                <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/70 mb-3">
                  Podcast
                </span>
                <h1 className="font-cormorant text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-text-main mb-2">
                  De{" "}
                  <span className="font-dancing-script text-primary text-[1.1em]">
                    Toxica
                  </span>{" "}
                  a Sin Toxicos
                </h1>
                <p className="text-base md:text-lg text-text-main/50 mb-8 leading-relaxed max-w-lg mx-auto md:mx-0">
                  Sumergete en conversaciones profundas sobre bienestar, salud
                  natural y como transformar tu vida. Cada episodio esta
                  disenado para inspirarte y darte herramientas practicas para
                  vivir una vida mas plena y sin toxicos.
                </p>

                {/* Platform buttons */}
                <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-3">
                  <a
                    href="https://open.spotify.com/show/6eMZqxyHUtW46yJd0Et4uw"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 bg-[#1DB954] text-white font-medium py-3 px-6 rounded-full text-sm transition-all duration-300 hover:brightness-110 hover:shadow-[0_0_20px_rgba(29,185,84,0.3)]"
                  >
                    <FaSpotify className="w-5 h-5" />
                    Escuchar en Spotify
                  </a>
                  <a
                    href="https://podcasts.apple.com/us/podcast/de-t%C3%B3xica-a-sin-t%C3%B3xicos/id1567244331"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 border border-text-main/20 text-text-main/80 font-medium py-3 px-6 rounded-full text-sm transition-all duration-300 hover:border-text-main/40 hover:text-text-main"
                  >
                    <FaApple className="w-5 h-5" />
                    Apple Podcasts
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Separator */}
        <div className="h-px max-w-6xl mx-auto bg-linear-to-r from-transparent via-border-default to-transparent" />

        {/* Episodes */}
        <section className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-14 md:py-20">
          <h2 className="font-cormorant text-2xl sm:text-3xl md:text-4xl font-semibold text-text-main text-center mb-10 md:mb-14">
            Ultimos Episodios
          </h2>

          <div className="space-y-4 md:space-y-5">
            {episodes.map((episode) => (
              <article
                key={episode.id}
                className="group bg-surface-card/50 border border-border-subtle rounded-xl p-5 sm:p-6 md:p-8 transition-all duration-300 hover:bg-surface-card hover:border-border-default"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                  {/* Episode number */}
                  <div className="shrink-0 flex items-center sm:items-start gap-3 sm:gap-0">
                    <span className="font-cormorant text-3xl md:text-4xl font-semibold text-primary/30 leading-none sm:w-14">
                      {episode.number}
                    </span>
                    <h3 className="sm:hidden font-medium text-text-main text-base leading-snug">
                      {episode.title}
                    </h3>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="hidden sm:block font-medium text-text-main text-base md:text-lg mb-2 leading-snug group-hover:text-primary/90 transition-colors duration-300">
                      {episode.title}
                    </h3>
                    <p className="text-sm md:text-base text-text-main/45 leading-relaxed line-clamp-3 mb-5">
                      {episode.description}
                    </p>

                    {/* Links */}
                    <div className="flex items-center gap-3">
                      <a
                        href={episode.spotifyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-[#1DB954] hover:text-[#1ed760] transition-colors duration-300"
                      >
                        <FaSpotify className="w-4 h-4" />
                        <span>Spotify</span>
                      </a>
                      <span className="w-px h-3.5 bg-border-subtle" />
                      <a
                        href={episode.applePodcastLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-text-main/50 hover:text-text-main/80 transition-colors duration-300"
                      >
                        <FaApple className="w-4 h-4" />
                        <span>Apple</span>
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

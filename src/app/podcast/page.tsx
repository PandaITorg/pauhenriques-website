import { FaSpotify, FaApple } from "react-icons/fa";
import podcastCover from "@/assets/de-toxica-a-sin-toxicos.jpg";
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
    title: "MI EXPERIENCIA FAMILIAR CON EL EARTHING",
    description:
      "En este episodio te cuento como el sistema de descanso con conexion a tierra ha ayudado a mi familia en su descanso. Es un testimonio personal que la crisis de sueno que existian en mi familia y que gracias al Earthing lo hemos superado.",
    spotifyLink: "https://open.spotify.com/episode/6eMZqxyHUtW46yJd0Et4uw",
    applePodcastLink:
      "https://podcasts.apple.com/us/podcast/de-t%C3%B3xica-a-sin-t%C3%B3xicos/id1567244331",
  },
  {
    id: 2,
    title:
      "EPISODIO #10: EL VENENO SILENCIOSO QUE TE ESTAS COMIENDO TODOS LOS DIAS",
    description:
      "En esta ocasion mi esposo me va a acompanar ya que es un tema un poco espeso. Luego de mucha investigacion tengo informacion que te va a convencer al 100% de ir a tu cocina y botar todas las sartenes y ollas de teflon.",
    spotifyLink: "https://open.spotify.com/episode/5R0eOglaAltHGjnenJHK1C",
    applePodcastLink:
      "https://podcasts.apple.com/us/podcast/episodio-10-el-veneno-silencioso-que-te-est%C3%A1s/id1567244331?i=1000533922680",
  },
  {
    id: 3,
    title:
      "EPISODIO #9: CONOCE LOS BIORRITMOS DE TU CUERPO Y APLICALOS A TU FAVOR!",
    description:
      "En este episodio te cuento sobre los biorritmos del cuerpo, cuantos tenemos y como utilizarlos a nuestro favor para tener una mejor digestion, tener mas energia y si nuestra meta es bajar de peso.",
    spotifyLink: "https://open.spotify.com/episode/0228CedbhkVhM6E9g4xG8C",
    applePodcastLink:
      "https://podcasts.apple.com/us/podcast/episodio-9-conoce-los-biorritmos-de-tu-cuerpo-y/id1567244331?i=1000530979938",
  },
];

export default function Podcast() {
  return (
    <>
      <PodcastSchema episodes={episodes} />
      <div className="px-5 py-8 md:py-12 bg-tertiary text-text-inverted min-h-screen">
        <div className="container mx-auto">
          <section className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 mb-10 md:mb-12 p-5 sm:p-6 md:p-8 bg-white rounded-xl shadow-lg">
            <div className="md:w-1/3 flex justify-center">
              <Image
                src={podcastCover}
                alt="De Toxica a Sin Toxicos Podcast Cover"
                width={400}
                height={400}
                className="w-full max-w-50 sm:max-w-xs rounded-lg shadow-md h-auto"
              />
            </div>
            <div className="md:w-2/3 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
                De Toxica a Sin Toxicos
              </h1>
              <p className="text-base md:text-lg mb-5 md:mb-6 leading-relaxed">
                Sumergete en conversaciones profundas sobre bienestar, salud
                natural y como transformar tu vida. Cada episodio esta disenado
                para inspirarte y darte herramientas practicas para vivir una vida
                mas plena y sin toxicos.
              </p>
              <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-3">
                <a
                  href="https://open.spotify.com/show/6eMZqxyHUtW46yJd0Et4uw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary hover:bg-accent text-white font-bold py-3 px-5 rounded-full transition-colors duration-300 inline-flex items-center justify-center"
                >
                  <FaSpotify className="mr-2" /> Escuchar en Spotify
                </a>
                <a
                  href="https://podcasts.apple.com/us/podcast/de-t%C3%B3xica-a-sin-t%C3%B3xicos/id1567244331"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary hover:bg-accent text-white font-bold py-3 px-5 rounded-full transition-colors duration-300 inline-flex items-center justify-center"
                >
                  <FaApple className="mr-2" /> Apple Podcasts
                </a>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">
              Ultimos Episodios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
              {episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="bg-white p-5 sm:p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col"
                >
                  <h3 className="text-base sm:text-lg font-semibold mb-2 line-clamp-2">
                    {episode.title}
                  </h3>
                  <p className="mb-4 text-sm sm:text-base leading-relaxed text-text-inverted/80 line-clamp-4 grow">
                    {episode.description}
                  </p>
                  <div className="flex gap-3 mt-auto">
                    <a
                      href={episode.spotifyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary hover:bg-accent text-white font-bold py-2.5 px-4 rounded-full text-sm transition-colors duration-300 inline-flex items-center"
                    >
                      <FaSpotify className="mr-1.5" /> Spotify
                    </a>
                    <a
                      href={episode.applePodcastLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary hover:bg-accent text-white font-bold py-2.5 px-4 rounded-full text-sm transition-colors duration-300 inline-flex items-center"
                    >
                      <FaApple className="mr-1.5" /> Apple
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

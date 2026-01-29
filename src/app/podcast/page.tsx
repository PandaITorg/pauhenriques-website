import { FaSpotify, FaApple } from "react-icons/fa";
import podcastCover from "@/assets/de-toxica-a-sin-toxicos.jpg";
import PodcastSchema from "@/components/PodcastSchema";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: 'Podcast "De Tóxica a Sin Tóxicos" | Pau Henriques',
  description:
    "Escucha los episodios del podcast de Pau Henriques sobre bienestar, salud natural y desarrollo personal. Inspiración y herramientas prácticas para una vida plena y sin tóxicos.",
  alternates: {
    canonical: "https://www.pauhenriques.com/podcast",
  },
};

const episodes = [
  {
    id: 1,
    title: "MI EXPERIENCIA FAMILIAR CON EL EARTHING",
    description:
      "En este episodio te cuento como el sistema de descanso con conexión a tierra ha ayudado a mi familia en su descanso. Es un testimonio personal que la crisis de sueño que existían en mi familia y que gracias al Earthing lo hemos superado. Te invito a escucharlo y si te sientes identificada sepas que no estás sola y que existe un sistema que te puede ayudar de forma natural. Compártelo si conoces personas que tengan crisis de sueño y/o insomnio. Pau",
    spotifyLink: "https://open.spotify.com/episode/6eMZqxyHUtW46yJd0Et4uw",
    applePodcastLink:
      "https://podcasts.apple.com/us/podcast/de-t%C3%B3xica-a-sin-t%C3%B3xicos/id1567244331",
  },
  {
    id: 2,
    title:
      "EPISODIO #10: EL VENENO SILENCIOSO QUE TE ESTÁS COMIENDO TODOS LOS DÍAS",
    description:
      'Episodio 10 ! wow! Que emoción que compartas conmigo este espacio! En esta ocasión mi esposo me va a acompañar ya que es un tema un poco mmm "espeso" y necesitaba conversarlo o contárselo a alguien. Luego de mucha investigación tengo información que te va a convencer al 100% de ir a tu cocina y botar todas las sartenes y ollas de teflón que tengas para de una buena vez eliminarlo de tu vida. El Teflón nos envenena es un FACT! Cuéntame si fue clara o clarísima!',
    spotifyLink: "https://open.spotify.com/episode/5R0eOglaAltHGjnenJHK1C",
    applePodcastLink:
      "https://podcasts.apple.com/us/podcast/episodio-10-el-veneno-silencioso-que-te-est%C3%A1s/id1567244331?i=1000533922680",
  },
  {
    id: 3,
    title:
      "EPISODIO # 9 : CONOCE LOS BIORRITMOS DE TU CUERPO Y APLÍCALOS A TU FAVOR!",
    description:
      "Hola , bienvenida/o nuevamente a este espacio, estoy feliz de compartirlo contigo . En este episodio te cuento sobre los biorritmos del cuerpo, cuántos tenemos y cómo utilizarlos a nuestro favor para : tener una mejor digestión , tener más energía y si nuestra meta es bajar de peso, bueno pues sí para bajarlo! Cuéntame si esta información para tí tiene lógica y si la implementas, cuéntame como te va! Sígueme en instagram como pau_henriques para más información sobre salud integral. Te espero por allá un abrazo Pau",
    spotifyLink: "https://open.spotify.com/episode/0228CedbhkVhM6E9g4xG8C",
    applePodcastLink:
      "https://podcasts.apple.com/us/podcast/episodio-9-conoce-los-biorritmos-de-tu-cuerpo-y/id1567244331?i=1000530979938",
  },
];

export default function Podcast() {
  return (
    <>
      <PodcastSchema episodes={episodes} />

      <div className="px-4 py-8 bg-[#a4ac85] text-[#343d2a] min-h-screen">
        <div className="container mx-auto px-4">
          <section className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12 p-6 bg-white rounded-lg shadow-lg">
            <div className="md:w-1/3 flex justify-center">
              <Image
                src={podcastCover}
                alt="De Tóxica a Sin Tóxicos Podcast Cover"
                width={400}
                height={400}
                className="w-full max-w-xs rounded-lg shadow-md h-auto"
              />
            </div>
            <div className="md:w-2/3 text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-[#343d2a]">
                De Tóxica a Sin Tóxicos
              </h1>
              <p className="text-lg mb-6 text-[#343d2a]">
                Sumérgete en conversaciones profundas sobre bienestar, salud
                natural y cómo transformar tu vida. Cada episodio está diseñado
                para inspirarte y darte herramientas prácticas para vivir una vida
                más plena y sin tóxicos.
              </p>
              <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                <a
                  href="https://open.spotify.com/show/6eMZqxyHUtW46yJd0Et4uw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#a68a63] hover:bg-[#562f10] text-white font-bold py-2 px-4 rounded-full transition-colors duration-300 inline-flex items-center justify-center w-full sm:w-auto"
                >
                  <FaSpotify className="mr-2" /> Escuchar en Spotify
                </a>
                <a
                  href="https://podcasts.apple.com/us/podcast/de-t%C3%B3xica-a-sin-t%C3%B3xicos/id1567244331"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#a68a63] hover:bg-[#562f10] text-white font-bold py-2 px-4 rounded-full transition-colors duration-300 inline-flex items-center"
                >
                  <FaApple className="mr-2" /> Escuchar en Apple Podcasts
                </a>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-[#343d2a]">
              Últimos Episodios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  <h3 className="text-xl font-semibold mb-2 text-[#343d2a]">
                    {episode.title}
                  </h3>
                  <p className="mb-4 text-[#343d2a]">{episode.description}</p>
                  <div className="flex gap-4">
                    <a
                      href={episode.spotifyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#a68a63] hover:bg-[#562f10] text-white font-bold py-2 px-3 rounded-full text-sm transition-colors duration-300 inline-flex items-center"
                    >
                      <FaSpotify className="mr-1" /> Spotify
                    </a>
                    <a
                      href={episode.applePodcastLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#a68a63] hover:bg-[#562f10] text-white font-bold py-2 px-3 rounded-full text-sm transition-colors duration-300 inline-flex items-center"
                    >
                      <FaApple className="mr-1" /> Apple
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

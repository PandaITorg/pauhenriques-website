interface Episode {
  id: number;
  title: string;
  description: string;
  spotifyLink: string;
  applePodcastLink: string;
}

interface PodcastSchemaProps {
  episodes: Episode[];
}

const PodcastSchema: React.FC<PodcastSchemaProps> = ({ episodes }) => {
  const podcastSeriesSchema = {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    name: "De Tóxica a Sin Tóxicos",
    url: "https://www.pauhenriques.com/podcast",
    description: "Un podcast para quienes buscan un estilo de vida más saludable y consciente, libre de tóxicos. Conducido por Pau Henriques, cada episodio ofrece consejos prácticos, entrevistas con expertos y reflexiones para transformar tu bienestar físico y mental.",
    image: {
      "@type": "ImageObject",
      url: "https://www.pauhenriques.com/podcast-cover.jpg",
    },
    author: {
      "@type": "Person",
      name: "Pau Henriques",
    },
    potentialAction: {
        "@type": "ListenAction",
        target: [
            "https://open.spotify.com/show/6eMZqxyHUtW46yJd0Et4uw",
            "https://podcasts.apple.com/us/podcast/de-t%C3%B3xica-a-sin-t%C3%B3xicos/id1567244331",
        ],
    },
  };

  const episodeSchemas = episodes.map((episode) => ({
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    partOfSeries: {
      "@type": "PodcastSeries",
      name: "De Tóxica a Sin Tóxicos",
      url: "https://www.pauhenriques.com/podcast",
    },
    url: episode.spotifyLink, 
    name: episode.title,
    description: episode.description,
    episodeNumber: episode.id,
    potentialAction: {
      "@type": "ListenAction",
      target: [episode.spotifyLink, episode.applePodcastLink],
    },
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(podcastSeriesSchema) }}
      />
      {episodeSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
};

export default PodcastSchema;

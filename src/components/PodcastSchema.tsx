import React from 'react';

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
  const schemas = episodes.map(episode => ({
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    'name': episode.title,
    'description': episode.description,
    'url': episode.spotifyLink, // Using Spotify link as the canonical URL for the episode
    'partOfSeries': {
      '@type': 'PodcastSeries',
      'name': 'De Tóxica a Sin Tóxicos',
      'url': 'https://open.spotify.com/show/6eMZqxyHUtW46yJd0Et4uw' // Main show URL
    }
  }));

  return (
    <script type="application/ld+json">
      {JSON.stringify(schemas)}
    </script>
  );
};

export default PodcastSchema;

import React from 'react';

const SobreMiSchema: React.FC = () => {
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': 'Pau Henriques',
    'url': 'https://www.pauhenriques.com/sobre-mi',
    'image': 'https://www.pauhenriques.com/pau-no-bg.png', // Assuming this is the main image for Pau
    'sameAs': [
      'https://www.instagram.com/pau_henriques/',
      'https://open.spotify.com/show/6eMZqxyHUtW46yJd0Et4uw', // Podcast
      // Add other social media links if available
    ],
    'jobTitle': 'Ingeniera comercial experta en salud integral',
    'alumniOf': 'Universidad San Francisco de Quito', // Example, replace with actual university if applicable
    'knowsAbout': ['Nutrición', 'anti-aging', 'vida sin tóxicos', 'salud integral'],
    'description': 'Conoce mi historia con la psoriasis y cómo transformé mi vida a través de una alimentación saludable y un estilo de vida sin tóxicos. Te ayudo a sanar tu cuerpo de forma natural.'
  };

  return (
    <script type="application/ld+json">
      {JSON.stringify(personSchema)}
    </script>
  );
};

export default SobreMiSchema;

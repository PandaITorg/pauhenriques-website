import React from 'react';

const HomeSchema: React.FC = () => {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Pau Henriques',
    'url': 'https://www.pauhenriques.com/',
    'logo': 'https://www.pauhenriques.com/assets/logo-pauhenriques.svg',
    'sameAs': [
      'https://www.instagram.com/pau_henriques/',
      'https://open.spotify.com/show/6eMZqxyHUtW46yJd0Et4uw', // Podcast
    ],
    'contactPoint': {
      '@type': 'ContactPoint',
      'telephone': '+593991712532',
      'contactType': 'customer service'
    }
  };

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': 'Pau Henriques',
    'url': 'https://www.pauhenriques.com/sobre-mi',
    'image': 'https://www.pauhenriques.com/assets/pau-sobre-mi-1.jpg', // A high-quality headshot
    'jobTitle': 'Coach de Salud y Bienestar',
    'worksFor': {
      '@type': 'Organization',
      'name': 'Pau Henriques'
    },
    'description': 'Tras ser diagnosticada con Psoriasis, Pau Henriques emprendió un viaje para sanar su cuerpo desde adentro hacia afuera, adoptando un estilo de vida libre de tóxicos. Ahora, junto a su esposo, lidera la marca Carico en Ecuador, ayudando a otros a mejorar su salud y bienestar.',
    'sameAs': organizationSchema.sameAs
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Pau Henriques',
    'url': 'https://www.pauhenriques.com/',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': 'https://www.pauhenriques.com/tienda?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
       <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
};

export default HomeSchema;

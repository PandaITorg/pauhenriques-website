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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
};

export default HomeSchema;

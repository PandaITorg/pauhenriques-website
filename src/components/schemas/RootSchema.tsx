
const RootSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.pauhenriques.com/#organization",
        name: "Pau Henriques",
        url: "https://www.pauhenriques.com/",
        logo: {
          "@type": "ImageObject",
          url: "https://www.pauhenriques.com/pauhenriques-lightest-green.png",
        },
        sameAs: [
          "https://www.instagram.com/pau_henriques/",
          "https://www.tiktok.com/@pau_henriques",
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://www.pauhenriques.com/#website",
        url: "https://www.pauhenriques.com/",
        name: "Pau Henriques",
        publisher: {
          "@id": "https://www.pauhenriques.com/#organization",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: "https://www.pauhenriques.com/?s={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default RootSchema;

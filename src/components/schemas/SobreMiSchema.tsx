
const SobreMiSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Pau Henriques",
    url: "https://www.pauhenriques.com/sobre-mi",
    sameAs: [
      "https://www.instagram.com/pau_henriques/",
      "https://www.tiktok.com/@pau_henriques",
      "https://open.spotify.com/show/6eMZqxyHUtW46yJd0Et4uw",
      "https://podcasts.apple.com/us/podcast/de-t%C3%B3xica-a-sin-t%C3%B3xicos/id1567244331",
    ],
    jobTitle: "Coach de Vida Sin Tóxicos",
    worksFor: {
      "@type": "Organization",
      name: "Pau Henriques",
    },
    image: {
      "@type": "ImageObject",
      url: "https://www.pauhenriques.com/pau-sobre-mi-1.jpg",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://www.pauhenriques.com/sobre-mi",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default SobreMiSchema;

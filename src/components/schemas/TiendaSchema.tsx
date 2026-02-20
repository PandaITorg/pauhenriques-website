import React from 'react';

const TiendaSchema: React.FC = () => {
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': 'Tienda | Pau Henriques - Productos para una Vida Saludable',
    'description': 'Próximamente: una selección exclusiva de productos para un estilo de vida sin tóxicos. Suscríbete para ser el primero en saber de nuestra gran apertura.',
    'url': 'https://www.pauhenriques.com/tienda',
  };

  return (
    <script type="application/ld+json">
      {JSON.stringify(webPageSchema)}
    </script>
  );
};

export default TiendaSchema;

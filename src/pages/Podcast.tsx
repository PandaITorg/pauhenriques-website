import React from 'react';
import { Link } from 'react-router';

const Podcast = () => {
  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Link to="/" className="text-green-800 hover:underline">
            &larr; Volver al inicio
          </Link>
        </div>
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Episodios del Podcast
        </h1>
        <div className="flex justify-center">
          <iframe
            title="De Tóxica a Sin Tóxicos Podcast Episodes"
            src="https://embed.podcasts.apple.com/pe/podcast/de-t%C3%B3xica-a-sin-t%C3%B3xicos/id1567244331"
            height="450px"
            frameBorder="0"
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
            allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
            style={{
              width: '100%',
              maxWidth: '800px',
              overflow: 'hidden',
              borderRadius: '10px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              background: 'transparent',
            }}
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default Podcast;

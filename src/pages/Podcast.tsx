import React from 'react';
import { Link } from 'react-router';

const Podcast = () => {
  return (
    <div className="px-4 py-8 bg-[#a4ac85] text-[#343d2a] min-h-screen">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Link to="/" className="text-[#a68a63] hover:text-[#562f10] font-bold">
            &larr; Volver al inicio
          </Link>
        </div>
        <h1 className="text-4xl font-bold text-center mb-4">
          Episodios del Podcast
        </h1>
        <p className="text-lg text-center mb-8 max-w-2xl mx-auto">
          Sumérgete en conversaciones profundas sobre bienestar, salud natural y cómo transformar tu vida. Cada episodio está diseñado para inspirarte y darte herramientas prácticas para vivir una vida más plena y sin tóxicos.
        </p>
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

import React, { useState } from 'react';
import TiendaSchema from "../components/TiendaSchema";
import { ProductCard, productCardsData } from "../components/ProductCard";

export default function Tienda() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const GOOGLE_APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE'; // REPLACE THIS WITH YOUR DEPLOYED URL

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
      setError('Error: Google Apps Script URL no configurada. Por favor, reemplaza el placeholder.');
      return;
    }

    try {
      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Apps Script
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ email: email }).toString(),
      });

      // Google Apps Script with no-cors will always return opaque response, so we can't check response.ok
      // We assume success if no network error occurred.
      setSubmitted(true);
      setEmail(''); // Clear the input after submission
    } catch (err) {
      console.error('Error submitting email:', err);
      setError('Hubo un error al registrar tu correo. Inténtalo de nuevo más tarde.');
    }
  };

  return (
    <>
      <TiendaSchema />
      <div className="min-h-screen bg-[#a4ac85] text-[#343d2a] py-8 px-4">
        {/* Compact Email Subscription Form */}
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg mb-12 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-[#343d2a]">
            ¡Sé el primero en enterarte!
          </h1>
          <p className="text-md mb-6 text-gray-700">
            Suscríbete para recibir novedades y ofertas exclusivas de nuestra tienda.
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center">
              <input
                type="email"
                placeholder="Tu correo electrónico"
                className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#a68a63] text-[#343d2a] flex-grow"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-[#a68a63] hover:bg-[#562f10] text-white font-bold py-3 px-6 rounded-md transition-colors duration-300"
              >
                Suscribirme
              </button>
            </form>
          ) : (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">¡Gracias por tu interés!</strong>
              <span className="block sm:inline"> Te avisaremos cuando la tienda esté lista.</span>
            </div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
        </div>

        {/* Product Cards Section */}
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-text-main mb-12 text-center">
            Nuestros Productos Destacados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productCardsData.map((product, index) => (
              <ProductCard key={index} {...product} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
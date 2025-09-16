import React, { useState } from 'react';
import TiendaSchema from "../components/TiendaSchema";

export const metadata = {
  title: "Tienda | Pau Henriques - Productos para una Vida Saludable",
  description:
    "Próximamente: una selección exclusiva de productos para un estilo de vida sin tóxicos. Suscríbete para ser el primero en saber de nuestra gran apertura.",
  alternates: {
    canonical: "https://www.pauhenriques.com/tienda",
  },
};

export default function Tienda() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call or database save
    console.log('Email submitted:', email);
    setSubmitted(true);
    setEmail(''); // Clear the input after submission
  };

  return (
    <>
      <TiendaSchema />
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#a4ac85] text-[#343d2a]">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-[#343d2a]">
          ¡Próximamente: Nuestra Tienda en Línea!
        </h1>
        <p className="text-lg mb-6 text-[#343d2a]">
          Estamos trabajando arduamente para traerte una selección exclusiva de productos que complementarán tu camino hacia una vida más saludable y sin tóxicos.
        </p>
        <p className="mb-8 text-[#343d2a]">
          ¡Sé el primero en enterarte de nuestra gran apertura y de las novedades! Suscríbete a nuestra lista de correo.
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#a68a63] text-[#343d2a]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-[#a68a63] hover:bg-[#562f10] text-white font-bold py-3 px-6 rounded-md transition-colors duration-300"
            >
              Mantente Informado
            </button>
          </form>
        ) : (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">¡Gracias por tu interés!</strong>
            <span className="block sm:inline"> Te avisaremos cuando la tienda esté lista.</span>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
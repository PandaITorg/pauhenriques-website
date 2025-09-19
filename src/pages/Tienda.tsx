import React, { useState, useEffect } from "react";
import TiendaSchema from "../components/TiendaSchema";

// Import all product images
import acero1 from "../assets/producto-acero-quirurjico-3-16-1.webp";
import acero2 from "../assets/producto-acero-quirurjico-3-16-2.webp";
import acero3 from "../assets/producto-acero-quirurjico-3-16-3.webp";
import acero4 from "../assets/producto-acero-quirurjico-3-16-4.webp";
import acero5 from "../assets/producto-acero-quirurjico-3-16-5.webp";
import acero6 from "../assets/producto-acero-quirurjico-3-16-6.webp";
import acero7 from "../assets/producto-acero-quirurjico-3-16-7.webp";
import acero8 from "../assets/producto-acero-quirurjico-3-16-8.webp";

import aire1 from "../assets/producto-purificador-de-aire-1.webp";
import aire2 from "../assets/producto-purificador-de-aire-2.webp";
import aire3 from "../assets/producto-purificador-de-aire-3.webp";
import aire4 from "../assets/producto-purificador-de-aire-4.webp";
import aire5 from "../assets/producto-purificador-de-aire-5.webp";
import aire6 from "../assets/producto-purificador-de-aire-6.webp";

import agua1 from "../assets/producto-purificador-de-agua-1.webp";
import agua2 from "../assets/producto-purificador-de-agua-2.webp";
import agua3 from "../assets/producto-purificador-de-agua-3.webp";

import descanso1 from "../assets/producto-sistema-de-descanso-earthing-1.webp";
import descanso2 from "../assets/producto-sistema-de-descanso-earthing-2.webp";
import descanso3 from "../assets/producto-sistema-de-descanso-earthing-3.webp";
import descanso4 from "../assets/producto-sistema-de-descanso-earthing-4.webp";
import descanso5 from "../assets/producto-sistema-de-descanso-earthing-5.webp";
import descanso6 from "../assets/producto-sistema-de-descanso-earthing-6.webp";

import clean1 from "../assets/producto-clean-machine-1.webp";
import clean2 from "../assets/producto-clean-machine-2.webp";
import clean3 from "../assets/producto-clean-machine-3.webp";
import clean4 from "../assets/producto-clean-machine-4.webp";
import clean5 from "../assets/producto-clean-machine-5.webp";
import clean6 from "../assets/producto-clean-machine-6.webp";
import clean7 from "../assets/producto-clean-machine-7.webp";
import clean8 from "../assets/producto-clean-machine-8.webp";
import clean9 from "../assets/producto-clean-machine-9.webp";
import clean10 from "../assets/producto-clean-machine-10.webp";

import cuchillos1 from "../assets/producto-linea-de-cuchillos-acero-quirurjico-1.webp";
import cuchillos2 from "../assets/producto-linea-de-cuchillos-acero-quirurjico-2.webp";
import cuchillos3 from "../assets/producto-linea-de-cuchillos-acero-quirurjico-3.webp";
import cuchillos4 from "../assets/producto-linea-de-cuchillos-acero-quirurjico-4.webp";
import cuchillos5 from "../assets/producto-linea-de-cuchillos-acero-quirurjico-5.webp";
import cuchillos6 from "../assets/producto-linea-de-cuchillos-acero-quirurjico-6.webp";
import cuchillos7 from "../assets/producto-linea-de-cuchillos-acero-quirurjico-7.webp";

import juicer1 from "../assets/producto-el-juicer-1.webp";
import juicer2 from "../assets/producto-el-juicer-2.webp";
import juicer3 from "../assets/producto-el-juicer-3.webp";
import juicer4 from "../assets/producto-el-juicer-4.webp";

export interface ProductCardProps {
  images: string[];
  title: string;
  brand: string;
  description: string;
  whatsappLink: string;
}

const productos: ProductCardProps[] = [
  {
    title: "Acero Quirúrgico 3-16",
    images: [acero1, acero2, acero3, acero4, acero5, acero6, acero7, acero8],
    brand: "Carico",
    description:
      "Descubre la durabilidad y elegancia del acero quirúrgico Carico. Utensilios de cocina que combinan un diseño moderno con la máxima calidad para una cocción saludable y eficiente.",
    whatsappLink:
      "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20%22Acero%20Quirurgico%22,%20soy:%20%20",
  },
  {
    title: "Purificadores de Aire",
    images: [aire1, aire2, aire3, aire4, aire5, aire6],
    brand: "Carico",
    description:
      "Respira un aire más puro y saludable en tu hogar. Los purificadores de aire Carico eliminan eficazmente alérgenos, polvo y contaminantes, creando un ambiente fresco y limpio para ti y tu familia.",
    whatsappLink:
      "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20el%20purificador%20de%20aire,%20soy:%20%20",
  },
  {
    title: "Purificadores de Agua",
    images: [agua1, agua2, agua3],
    brand: "Carico",
    description:
      "Disfruta de agua pura y cristalina directamente de tu grifo. Los purificadores de agua Carico eliminan impurezas y contaminantes, garantizando que cada vaso sea refrescante y seguro.",
    whatsappLink:
      "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20el%20purificador%20de%20agua,%20soy:%20%20",
  },
  {
    title: "Descanso con Tecnología Earthing",
    images: [descanso1, descanso2, descanso3, descanso4, descanso5, descanso6],
    brand: "Carico",
    description:
      "Experimenta un descanso profundo y reparador. La tecnología Earthing de Carico te conecta con la energía natural de la tierra, mejorando tu bienestar y calidad de sueño.",
    whatsappLink:
      "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20el%20descanso%20con%20tecnolog%C3%ADa%20earthing%20,%20soy:%20%20",
  },
  {
    title: "Clean Machine",
    images: [
      clean1,
      clean2,
      clean3,
      clean4,
      clean5,
      clean6,
      clean7,
      clean8,
      clean9,
      clean10,
    ],
    brand: "Carico",
    description:
      "La solución definitiva para una limpieza profunda y sin esfuerzo. La Clean Machine de Carico utiliza el poder del vapor para desinfectar y limpiar cualquier superficie de tu hogar sin químicos agresivos.",
    whatsappLink:
      "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20la%20clean%20machine,%20soy:%20%20",
  },
  {
    title: "Línea de Cuchillos de Acero Quirúrgico",
    images: [
      cuchillos1,
      cuchillos2,
      cuchillos3,
      cuchillos4,
      cuchillos5,
      cuchillos6,
      cuchillos7,
    ],
    brand: "Carico",
    description:
      "Precisión y durabilidad en cada corte. La línea de cuchillos de acero quirúrgico Carico ofrece un rendimiento profesional para todas tus preparaciones culinarias.",
    whatsappLink:
      "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20la%l%C3%ADnea%de%cuchillos%de%acero%Quirurgico,%20soy:%20%20",
  },
  {
    title: "El Juicer",
    images: [juicer1, juicer2, juicer3, juicer4],
    brand: "Carico",
    description:
      "Extrae el máximo de nutrientes de tus frutas y verduras. El Juicer de Carico es tu aliado perfecto para un estilo de vida saludable, permitiéndote crear jugos frescos y deliciosos en segundos.",
    whatsappLink:
      "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20el%20juicer,%20soy:%20%20",
  },
];

const ProductCard: React.FC<ProductCardProps> = ({
  images,
  title,
  brand,
  description,
  whatsappLink,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105">
      <div className="relative w-full h-48">
        {images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`${title} - ${index + 1}`}
            className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-xl mb-2 text-[#343d2a]">{title}</h3>
        <p className="text-sm text-gray-500 mb-2">{brand}</p>
        <p className="text-gray-700 text-base mb-4">{description}</p>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-[#a68a63] hover:bg-[#562f10] text-white font-bold py-2 px-4 rounded-md text-center transition-colors duration-300"
        >
          Preguntar por WhatsApp
        </a>
      </div>
    </div>
  );
};

export default function Tienda() {
  const [email, setEmail] = useState("");
  const [subscribe, setSubscribe] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const GOOGLE_APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbw0sdRnBFNV_Q2iJkK6vqPS60nkviycka2rN5cQq2cVsRIlHUQdWGWERiLXW4ohpamjVw/exec"; // REPLACE THIS WITH YOUR DEPLOYED URL

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor, introduce un correo electrónico válido.");
      return;
    }

    setIsLoading(true);

    if (!GOOGLE_APPS_SCRIPT_URL) {
      setError(
        "Error: Google Apps Script URL no configurada. Por favor, reemplaza el placeholder."
      );
      setIsLoading(false);
      return;
    }

    try {
      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // Required for Google Apps Script
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: email,
          subscribe: subscribe.toString(),
        }).toString(),
      });

      setSubmitted(true);
      setEmail("");
      setSubscribe(false);
    } catch (err) {
      console.error("Error submitting email:", err);
      setError(
        "Hubo un error al registrar tu correo. Inténtalo de nuevo más tarde."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowForm(false);
    }, 500); // This duration should match the transition duration
  };

  return (
    <>
      <TiendaSchema />
      <div className="min-h-screen bg-[#a4ac85] text-[#343d2a] py-8 px-4">
        {/* Compact Email Subscription Form */}
        {showForm && (
          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              isClosing ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
            }`}
          >
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg mb-12 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-[#343d2a]">
                ¡Pronto habilitaremos la tienda en línea!
              </h1>
              <p className="text-md mb-6 text-gray-700">
                ¡Se el primero en enterarte! Suscríbete y te notificaremos
                cuando este operativa.
              </p>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <input
                      type="email"
                      placeholder="Tu correo electrónico"
                      className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#a68a63] text-[#343d2a] flex-grow"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      className="bg-[#a68a63] hover:bg-[#562f10] text-white font-bold py-3 px-6 rounded-md transition-colors duration-300 flex items-center justify-center"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Enviando...
                        </>
                      ) : (
                        "Suscribirme"
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-center">
                    <input
                      id="subscribe"
                      type="checkbox"
                      checked={subscribe}
                      onChange={(e) => setSubscribe(e.target.checked)}
                      className="h-4 w-4 accent-[#a68a63] focus:ring-[#a68a63] border-gray-300 rounded"
                    />
                    <label
                      htmlFor="subscribe"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Quiero recibir notificaciones de nuevos productos y
                      ofertas.
                    </label>
                  </div>
                </form>
              ) : (
                <div
                  className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
                  role="alert"
                >
                  <strong className="font-bold">
                    ¡Gracias por tu interés!
                  </strong>
                  <span className="block sm:inline">
                    {" "}
                    Te avisaremos cuando la tienda esté lista.
                  </span>
                  <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                    <svg
                      onClick={handleClose}
                      className="fill-current h-6 w-6 text-green-500 cursor-pointer"
                      role="button"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <title>Close</title>
                      <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
                    </svg>
                  </span>
                </div>
              )}
              {error && (
                <div
                  className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4"
                  role="alert"
                >
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Cards Section */}
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-text-main mb-12 text-center">
            Nuestros Productos Destacados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productos.map((product, index) => (
              <ProductCard key={index} {...product} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

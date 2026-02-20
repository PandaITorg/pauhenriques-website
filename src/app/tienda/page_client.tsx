"use client";

import React, { useState, useEffect } from "react";
import TiendaSchema from "@/components/schemas/TiendaSchema";
import Image from "next/image";

// Conexión a Firebase y tipos
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { Product } from "@/types/product";

// Importamos el store del carrito
import { useCartStore } from "@/stores/cart.store";

// --- COMPONENTE DE TARJETA DE PRODUCTO ---
interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const addItemToCart = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (product.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % product.images.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [product.images.length]);

  const handleAddToCart = () => {
    addItemToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const whatsappLink = `https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau,%20quiero%20conocer%20m%C3%A1s%20sobre%20el%20producto%20"${product.name}".`;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105 flex flex-col">
      <div className="relative w-full h-48">
        {product.images.map((image, index) => {
          // SOLUCIÓN: Limpiamos la URL de la imagen para remover comillas y espacios
          const cleanedImage = image.replace(/"/g, '').trim();
          
          return (
            <Image
              key={index}
              src={cleanedImage}
              alt={`${product.name} - Imagen ${index + 1}`}
              fill
              className={`object-cover transition-opacity duration-1000 ease-in-out ${
                index === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={index === 0}
            />
          );
        })}
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="font-bold text-xl mb-2 text-[#343d2a]">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-2 capitalize">{product.brand}</p>
        <p className="text-gray-700 text-base mb-4 flex-grow">{product.description}</p>
        
        {product.brand === 'wellme' ? (
          <div className="mt-auto">
            {product.price && <p className="font-bold text-2xl text-[#343d2a] mb-3">${product.price.toFixed(2)}</p>}
            <button
              onClick={handleAddToCart}
              disabled={isAdded}
              className={`block w-full font-bold py-2 px-4 rounded-md text-center transition-all duration-300 ${
                isAdded
                  ? "bg-green-500 text-white cursor-not-allowed"
                  : "bg-[#343d2a] hover:bg-[#5a6b4a] text-white"
              }`}
            >
              {isAdded ? "¡Añadido!" : "Agregar al Carrito"}
            </button>
          </div>
        ) : (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full mt-auto bg-[#a68a63] hover:bg-[#562f10] text-white font-bold py-2 px-4 rounded-md text-center transition-colors duration-300"
          >
            Preguntar por WhatsApp
          </a>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL DE LA TIENDA ---
export default function Tienda() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState("");
  const [subscribe, setSubscribe] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsQuery = query(collection(db, "products"));
        const querySnapshot = await getDocs(productsQuery);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product));
        setProducts(productsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("No se pudieron cargar los productos. Por favor, intenta de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const emailSubmitted = localStorage.getItem("emailSubmitted");
      if (emailSubmitted) {
        setShowForm(false);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(""); 

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError("Por favor, introduce un correo electrónico válido.");
      return;
    }

    setIsLoadingForm(true);
    const GOOGLE_APPS_SCRIPT_URL ="https://script.google.com/macros/s/AKfycbw0sdRnBFNV_Q2iJkK6vqPS60nkviycka2rN5cQq2cVsRIlHUQdWGWERiLXW4ohpamjVw/exec";
    
    try {
      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: new URLSearchParams({ email: email, subscribe: subscribe.toString() }).toString(),
      });

      setSubmitted(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem("emailSubmitted", "true");
      }
      setEmail("");
      setSubscribe(false);
    } catch (err) {
      console.error("Error submitting email:", err);
      setFormError("Hubo un error al registrar tu correo. Inténtalo de nuevo más tarde.");
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowForm(false);
    }, 500); 
  };

  if (loading) {
    return <p className="text-center min-h-screen bg-[#a4ac85] py-8">Cargando productos...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 min-h-screen bg-[#a4ac85] py-8">{error}</p>;
  }

  return (
    <>
      <TiendaSchema />
      <div className="min-h-screen bg-[#a4ac85] text-[#343d2a] py-8 px-4">
        {showForm && (
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
              isClosing ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
            }`}>
            {/* Formulario de suscripción aquí */}
          </div>
        )}

        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-[#343d2a] mb-12 text-center">
            Nuestros Productos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

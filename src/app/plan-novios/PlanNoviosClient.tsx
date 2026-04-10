"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaWhatsapp } from "react-icons/fa";
import { HiOutlineArrowRight, HiOutlineBookOpen } from "react-icons/hi2";
import {
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineHeart,
} from "react-icons/hi2";
import { productService } from "@/services/firestore/productService";
import { getPlanByUserId } from "@/services/firestore/planNoviosService";
import { useAuth } from "@/context/AuthContext";
import type { CaricoProduct } from "@/types/product";

export default function PlanNoviosClient() {
  const { user } = useAuth();
  const [caricoProducts, setCaricoProducts] = useState<CaricoProduct[]>([]);
  const [hasExistingPlan, setHasExistingPlan] = useState(false);

  // Check if logged-in user already has a plan
  useEffect(() => {
    if (!user) return;
    getPlanByUserId(user.uid).then((plan) => {
      if (plan) setHasExistingPlan(true);
    });
  }, [user]);

  useEffect(() => {
    productService.getProductsByType("Carico").then((products) => {
      setCaricoProducts(products as CaricoProduct[]);
    });
  }, []);
  return (
    <div className="bg-warm-50 text-text-inverted">
      {/* Banner for existing plan owners */}
      {hasExistingPlan && (
        <div className="bg-warm-900 text-warm-50 py-3 text-center text-sm relative z-40">
          <Link
            href="/plan-novios/mi-plan"
            className="inline-flex items-center gap-2 hover:text-primary transition-colors cursor-pointer"
          >
            Ya tienes un Plan Novios activo — Ver mi dashboard
            <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ─── Hero: Full-screen with image ─── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/pau-henriques-web-v1.firebasestorage.app/o/public-assets%2Fplan-novios%2Fhero.webp?alt=media"
            alt="Interior elegante de hogar moderno"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-warm-900/30" />
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-warm-50" />
        </div>

        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="max-w-4xl space-y-8 bg-white/8 backdrop-blur-md p-10 md:p-14 rounded-3xl border border-white/15 shadow-2xl">
            <div className="w-16 h-px bg-primary" />
            <h1 className="font-cormorant text-5xl md:text-7xl leading-tight text-white">
              El regalo de bodas que se transforma en{" "}
              <span className="italic font-normal text-warm-200">
                Salud y Bienestar
              </span>{" "}
              para tu nuevo hogar
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-light max-w-2xl leading-relaxed">
              Creen un santuario de vida desde el primer dia. Una mesa de
              regalos disenada para los amantes del bienestar.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 pt-6">
              <Link
                href={hasExistingPlan ? "/plan-novios/mi-plan" : "/plan-novios/registrar"}
                className="bg-white text-warm-900 px-10 py-4 md:py-5 rounded-full shadow-lg hover:bg-warm-50 transition-all flex items-center justify-center gap-3 font-medium cursor-pointer"
              >
                {hasExistingPlan ? "Ver mi Plan" : "Registra tu Plan"}
                <HiOutlineArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="https://wa.me/593991712532?text=Hola%20Pau,%20quiero%20informacion%20sobre%20el%20Plan%20Novios%20Carico"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white/40 text-white px-10 py-4 md:py-5 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <FaWhatsapp className="w-5 h-5" />
                Consultar
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Como Funciona ─── */}
      <section className="py-24 md:py-32 bg-warm-50">
        <div className="container mx-auto px-6 md:px-12">
          {/* Header with decorative line */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 md:mb-20 gap-8">
            <div className="max-w-2xl">
              <span className="font-dancing-script text-2xl md:text-3xl text-primary block mb-4">
                A gift for your forever
              </span>
              <h2 className="font-cormorant text-4xl md:text-5xl text-warm-900">
                Como Funciona?
              </h2>
            </div>
            <div className="hidden md:block w-32 h-px bg-warm-300 mb-4" />
          </div>

          {/* Steps with tall images */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Step 1 */}
            <div className="group">
              <div className="relative overflow-hidden aspect-4/5 rounded-2xl mb-8">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/pau-henriques-web-v1.firebasestorage.app/o/public-assets%2Fplan-novios%2Fpaso-1.webp?alt=media"
                  alt="Novios planeando su boda"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-6 left-6 bg-primary/90 backdrop-blur-md w-14 h-14 flex items-center justify-center rounded-full font-cormorant text-xl text-white">
                  1
                </div>
              </div>
              <div className="w-8 h-px bg-primary mb-6" />
              <h3 className="font-cormorant text-2xl mb-4 text-warm-900">
                Registra tu Plan
              </h3>
              <p className="text-warm-600 leading-relaxed">
                Crea tu cuenta, anade los detalles de tu gran dia y obten un
                enlace unico y personalizado para tus invitados.
              </p>
            </div>

            {/* Step 2 */}
            <div className="group">
              <div className="relative overflow-hidden aspect-4/5 rounded-2xl mb-8">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/pau-henriques-web-v1.firebasestorage.app/o/public-assets%2Fplan-novios%2Fpaso-2.webp?alt=media"
                  alt="Invitados celebrando"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-6 left-6 bg-primary/90 backdrop-blur-md w-14 h-14 flex items-center justify-center rounded-full font-cormorant text-xl text-white">
                  2
                </div>
              </div>
              <div className="w-8 h-px bg-primary mb-6" />
              <h3 className="font-cormorant text-2xl mb-4 text-warm-900">
                Comparte con tus Invitados
              </h3>
              <p className="text-warm-600 leading-relaxed">
                Tus seres queridos contribuyen cualquier monto de forma segura a
                traves de tu enlace, dejando mensajes de amor.
              </p>
            </div>

            {/* Step 3 */}
            <div className="group">
              <div className="relative overflow-hidden aspect-4/5 rounded-2xl mb-8">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/pau-henriques-web-v1.firebasestorage.app/o/public-assets%2Fplan-novios%2Fpaso-3.webp?alt=media"
                  alt="Productos premium Carico"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-6 left-6 bg-primary/90 backdrop-blur-md w-14 h-14 flex items-center justify-center rounded-full font-cormorant text-xl text-white">
                  3
                </div>
              </div>
              <div className="w-8 h-px bg-primary mb-6" />
              <h3 className="font-cormorant text-2xl mb-4 text-warm-900">
                Elige tus Productos
              </h3>
              <p className="text-warm-600 leading-relaxed">
                Acumula fondos para adquirir productos Carico a precios
                exclusivos, equipando su hogar con lo mejor en salud.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Beneficios ─── */}
      <section className="py-24 md:py-32 bg-warm-50">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left: frosted card */}
            <div className="relative">
              <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl z-0" />
              <div className="bg-warm-100/60 backdrop-blur-sm p-8 md:p-12 rounded-2xl relative z-10 border border-warm-200/50">
                <h2 className="font-cormorant text-4xl mb-12 text-warm-900">
                  Beneficios Exclusivos
                </h2>

                <div className="space-y-10">
                  {/* Para la Pareja */}
                  <div>
                    <h4 className="text-primary font-semibold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                      <span className="w-8 h-px bg-primary" />
                      Para la Pareja
                    </h4>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <HiOutlineCheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-warm-700">
                          Acceso a precios preferenciales en linea Wellness de
                          Carico.
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <HiOutlineCheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-warm-700">
                          Sin regalos duplicados; ustedes eligen lo que realmente
                          necesitan.
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <HiOutlineCheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-warm-700">
                          Dashboard en tiempo real para ver aportes y mensajes.
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Para los Invitados */}
                  <div>
                    <h4 className="text-primary font-semibold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                      <span className="w-8 h-px bg-primary" />
                      Para los Invitados
                    </h4>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <HiOutlineShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-warm-700">
                          Contribucion flexible de cualquier monto desde
                          cualquier lugar.
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <HiOutlineShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-warm-700">
                          Proceso de pago 100% seguro y encriptado.
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <HiOutlineHeart className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-warm-700">
                          Sin necesidad de crear cuentas; rapido y elegante.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: image + stats */}
            <div className="relative space-y-10 lg:pl-8">
              <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-primary/5 rounded-full blur-3xl z-0" />
              <div className="aspect-3/4 relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/pau-henriques-web-v1.firebasestorage.app/o/public-assets%2Fplan-novios%2Fbeneficios.webp?alt=media"
                  alt="Detalle de regalo de bodas"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-warm-100/60 backdrop-blur-sm rounded-2xl p-6 border border-warm-200/50 relative z-10">
                <div className="flex items-center gap-8 justify-center">
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-cormorant text-warm-900">
                      100%
                    </span>
                    <span className="text-xs uppercase tracking-wider text-warm-600">
                      Seguro
                    </span>
                  </div>
                  <div className="w-px h-12 bg-warm-300" />
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-cormorant text-warm-900">
                      $0
                    </span>
                    <span className="text-xs uppercase tracking-wider text-warm-600">
                      Costo de registro
                    </span>
                  </div>
                  <div className="w-px h-12 bg-warm-300" />
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-cormorant text-warm-900">
                      QR
                    </span>
                    <span className="text-xs uppercase tracking-wider text-warm-600">
                      Compartible
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Productos: Editorial Magazine Grid ─── */}
      <section className="py-24 md:py-32 bg-warm-200/50">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16 md:mb-20">
            <span className="font-dancing-script text-2xl md:text-3xl text-primary block mb-4">
              Carico Wellness
            </span>
            <h2 className="font-cormorant text-4xl md:text-5xl text-warm-900 mb-6">
              Productos para tu Nuevo Hogar
            </h2>
            <p className="text-warm-600 max-w-2xl mx-auto text-lg font-light">
              Tecnologia de vanguardia para la purificacion de aire, agua y
              nutricion superior.
            </p>
          </div>

          {caricoProducts.length > 0 ? (
            <div className="space-y-5">
              {/* Hero product — full-width lifestyle card */}
              {caricoProducts[0] && (
                <Link
                  href={`/tienda/${caricoProducts[0].id}`}
                  className="group relative overflow-hidden rounded-3xl block cursor-pointer"
                >
                  <div className="relative aspect-video md:aspect-21/9">
                    {caricoProducts[0].images?.[0] ? (
                      <Image
                        src={caricoProducts[0].images[0]}
                        alt={caricoProducts[0].name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="100vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-warm-200" />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-warm-900/80 via-warm-900/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                      <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-3 block">
                        {caricoProducts[0].category || "Carico Wellness"}
                      </span>
                      <h3 className="font-cormorant text-3xl md:text-4xl text-white mb-3">
                        {caricoProducts[0].name}
                      </h3>
                      <p className="text-white/70 max-w-lg line-clamp-2 mb-4">
                        {caricoProducts[0].description}
                      </p>
                      <span className="inline-flex items-center gap-2 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Descubrir <HiOutlineArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {/* Row 2: Asymmetric — portrait + landscape */}
              {caricoProducts[1] && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <Link
                    href={`/tienda/${caricoProducts[1].id}`}
                    className="md:col-span-5 group relative overflow-hidden rounded-3xl block cursor-pointer"
                  >
                    <div className="relative aspect-3/4">
                      {caricoProducts[1].images?.[0] ? (
                        <Image
                          src={caricoProducts[1].images[0]}
                          alt={caricoProducts[1].name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 42vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-warm-200" />
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-warm-900/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <span className="text-xs uppercase tracking-[0.2em] text-primary/80 block mb-2">
                          {caricoProducts[1].category || "Carico Wellness"}
                        </span>
                        <h4 className="font-cormorant text-2xl text-white">
                          {caricoProducts[1].name}
                        </h4>
                      </div>
                    </div>
                  </Link>

                  {caricoProducts[2] ? (
                    <Link
                      href={`/tienda/${caricoProducts[2].id}`}
                      className="md:col-span-7 group relative overflow-hidden rounded-3xl block cursor-pointer"
                    >
                      <div className="relative aspect-4/3">
                        {caricoProducts[2].images?.[0] ? (
                          <Image
                            src={caricoProducts[2].images[0]}
                            alt={caricoProducts[2].name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 58vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-warm-200" />
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-warm-900/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                          <span className="text-xs uppercase tracking-[0.2em] text-primary/80 block mb-2">
                            {caricoProducts[2].category || "Carico Wellness"}
                          </span>
                          <h4 className="font-cormorant text-2xl text-white">
                            {caricoProducts[2].name}
                          </h4>
                        </div>
                      </div>
                    </Link>
                  ) : null}
                </div>
              )}

              {/* Row 3: Inverted — landscape product + CTA card */}
              {caricoProducts[3] && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <Link
                    href={`/tienda/${caricoProducts[3].id}`}
                    className="md:col-span-7 group relative overflow-hidden rounded-3xl block cursor-pointer"
                  >
                    <div className="relative aspect-4/3">
                      {caricoProducts[3].images?.[0] ? (
                        <Image
                          src={caricoProducts[3].images[0]}
                          alt={caricoProducts[3].name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 58vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-warm-200" />
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-warm-900/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <span className="text-xs uppercase tracking-[0.2em] text-primary/80 block mb-2">
                          {caricoProducts[3].category || "Carico Wellness"}
                        </span>
                        <h4 className="font-cormorant text-2xl text-white">
                          {caricoProducts[3].name}
                        </h4>
                      </div>
                    </div>
                  </Link>

                  {/* Explore CTA card */}
                  <div className="md:col-span-5 bg-warm-100/60 backdrop-blur-sm rounded-3xl border border-warm-200/50 p-8 md:p-10 flex flex-col justify-center items-center text-center">
                    <span className="font-dancing-script text-2xl text-primary mb-4">
                      Carico Wellness
                    </span>
                    <h4 className="font-cormorant text-2xl text-warm-900 mb-4">
                      Descubre toda la coleccion
                    </h4>
                    <p className="text-warm-600 text-sm mb-8 max-w-xs">
                      Equipen su hogar con lo mejor en salud, agua pura y nutricion
                      de alta gama.
                    </p>
                    <Link
                      href="/tienda?tab=catalogo"
                      className="inline-flex items-center gap-3 text-warm-900 font-medium tracking-widest uppercase text-sm border-b-2 border-warm-300 pb-2 hover:border-warm-900 transition-all cursor-pointer"
                    >
                      Ver Catalogo
                      <HiOutlineBookOpen className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Fallback CTA if less than 4 products */}
              {caricoProducts.length < 4 && (
                <div className="mt-10 text-center">
                  <Link
                    href="/tienda?tab=catalogo"
                    className="inline-flex items-center gap-4 text-warm-900 font-medium tracking-widest uppercase text-sm border-b-2 border-warm-300 pb-2 hover:border-warm-900 transition-all cursor-pointer"
                  >
                    Ver Catalogo Carico
                    <HiOutlineBookOpen className="w-5 h-5" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* Skeleton loading — editorial layout */
            <div className="space-y-5">
              <div className="rounded-3xl bg-warm-200/50 animate-pulse aspect-video md:aspect-21/9" />
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-5 rounded-3xl bg-warm-200/50 animate-pulse aspect-3/4" />
                <div className="md:col-span-7 rounded-3xl bg-warm-200/50 animate-pulse aspect-4/3" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-7 rounded-3xl bg-warm-200/50 animate-pulse aspect-4/3" />
                <div className="md:col-span-5 rounded-3xl bg-warm-100/60 animate-pulse aspect-square" />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Final CTA: Warm dark background ─── */}
      <section className="py-24 md:py-32 bg-warm-900 text-warm-50 text-center relative overflow-hidden">
        {/* Subtle background image */}
        <div className="absolute inset-0 opacity-[0.08]">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/pau-henriques-web-v1.firebasestorage.app/o/public-assets%2Fplan-novios%2Fcta-final.webp?alt=media"
            alt=""
            className="w-full h-full object-cover"
            aria-hidden="true"
          />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto space-y-10">
            <span className="font-dancing-script text-2xl text-primary block">
              Para siempre
            </span>
            <h2 className="font-cormorant text-4xl md:text-6xl leading-tight text-warm-50">
              Construyan su hogar con bienestar desde el primer dia
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-5">
              <Link
                href={hasExistingPlan ? "/plan-novios/mi-plan" : "/plan-novios/registrar"}
                className="bg-primary text-white px-12 py-4 md:py-5 rounded-full hover:bg-primary-hover transition-colors shadow-xl font-medium cursor-pointer"
              >
                {hasExistingPlan ? "Ver mi Plan Novios" : "Registra tu Plan Novios"}
              </Link>
              <a
                href="https://wa.me/593991712532?text=Hola%20Pau,%20quiero%20informacion%20sobre%20el%20Plan%20Novios%20Carico"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-warm-50/25 text-warm-50 px-12 py-4 md:py-5 rounded-full hover:bg-warm-800 transition-colors font-medium cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <FaWhatsapp className="w-5 h-5" />
                Mas Informacion
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

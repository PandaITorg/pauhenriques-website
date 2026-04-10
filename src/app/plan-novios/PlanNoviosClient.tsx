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
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeQS2V7Jsn4RwlmUeltKKBGtTyGh9rWvyCXPk6yK0iTTzYIccQh5S5RqpS-BuDwI8tdZmNZSo9xQXhN8gHgSgO4b5H8VGHk4nPpyTsbxTbSUJhtEj_qgbiNamUpSsT9Apt4UiErJM-z-IOGkfIXr6rP4FLXRpgoPkxNYKRDh-DrBNXT3xKqLanW8ZJTWOrVvPxQC-gX2J6AnQQ5RGu0Yjn3DJb_bWlBwKwB3ckLNyxsog9zk2CdcRASbFyRXR47M7OQds1gqFtHK4"
            alt="Interior elegante de hogar moderno"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-warm-50" />
        </div>

        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="max-w-4xl space-y-8 bg-black/10 backdrop-blur-sm p-8 md:p-12 rounded-xl border border-white/10">
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
                className="bg-white text-warm-900 px-10 py-4 md:py-5 rounded-sm shadow-lg hover:bg-warm-50 transition-all flex items-center justify-center gap-3 font-medium cursor-pointer"
              >
                {hasExistingPlan ? "Ver mi Plan" : "Registra tu Plan"}
                <HiOutlineArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="https://wa.me/593991712532?text=Hola%20Pau,%20quiero%20informacion%20sobre%20el%20Plan%20Novios%20Carico"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white/40 text-white px-10 py-4 md:py-5 rounded-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <FaWhatsapp className="w-5 h-5" />
                Consultar
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Como Funciona ─── */}
      <section className="py-24 md:py-32 bg-warm-100">
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
              <div className="relative overflow-hidden aspect-4/5 rounded-xl mb-8">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUQDhAAr6rq34hvN0GQSO_ZBgE6kp_6IGe5vCd3upPz2mSCDllB0CfzlHe88LguaYn4EDmb9aAG3_ZnrGyCd4sLvGVsEvFjAv15kaERBEDJCJcVHesv5eMAhshN0PYzcQ9Y67X9oKR3auQUTHkYXEVrC3zBn9wqiZ4UXdwSUMaxmoEd_JhwlWkJbNz33ujlzHGrwA30lKh_itXMl1m82lQwZLfP05FnPDxnAMFKvgTLVytAyvLhGTBXEwppaDYl7k_for6WKwbkBU"
                  alt="Novios planeando su boda"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md w-12 h-12 flex items-center justify-center rounded-full font-cormorant text-xl text-warm-900">
                  1
                </div>
              </div>
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
              <div className="relative overflow-hidden aspect-4/5 rounded-xl mb-8">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBf_qWcBn24dD_Jjv-M1V6iYIQtCmHZoqypy2Peq5Iocm1IDF7f5QtN42m_uCTi97wJeJZPvfchK2l5SG91g_PdDiEWHDlxsglylgIQMp-Zrs2gsGtVbA7b62Ms782ErYM4i7eRP41BT2nOk-MfvLGjANgvvIQWtEzSKflnC0qA6NzGPN_cqnCPXecXCSgSHTRbk9dMiAPCGj5S8rDFPR2nbQ8mNmaqbO0L2CktXggCNwTIF0HmgKldmvvky2AJtakVWVvfiMwqOZM"
                  alt="Invitados celebrando"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md w-12 h-12 flex items-center justify-center rounded-full font-cormorant text-xl text-warm-900">
                  2
                </div>
              </div>
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
              <div className="relative overflow-hidden aspect-4/5 rounded-xl mb-8">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCE1WVbrLJN255IPyRZbd3z-ovE5I2bXwpqS1be67xDFr9y4Ksr4aumRAhKgwzX7bNNj4lJt9Y3spqF6BHOgsw3eJ5EOQNSVlp2M6Bjs73fMlePILEI82LAHfSJmDvOJYZgK1lKtnDrU0WoSuDxXHsRoobxNccV0Iw5KeYBhjcHbLI91JCTAX7eP-Og3JdeJkQI-BlbQvYtVSvYZZiclDwvN20lvHjHyVu-ni2whjKLaLgbAQ4z1mAPExc09p-5YOzTonNUxnqF0AY"
                  alt="Productos premium Carico"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md w-12 h-12 flex items-center justify-center rounded-full font-cormorant text-xl text-warm-900">
                  3
                </div>
              </div>
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
            <div className="space-y-10 lg:pl-8">
              <div className="aspect-square relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6oFt4kb2vIKPjjMTUN6uuCoHmuymCK8LSFSOG_u2De1u0pPrq9zGHfANRJonXoMIsr6uzRmUBtmDSyY8CCyydnPBVr7oOv-nXjcdGdeXLznnAcKAISBGTflFh_vUC8STTTpdg2bLD1a1lfSKPKowyDxzz_zMjaK0LQpQxFDgXeTgOaxrhSiiDLHS5Bc-0F7M2VfCtlgE1TmeLWYuLNNFOXiWJQsJRFwU0lecxgihVQlgjSc6PrTzOm1VHGQnh_nH1i7Ypp8adG3Q"
                  alt="Detalle de regalo de bodas"
                  className="w-full h-full object-cover"
                />
              </div>
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
      </section>

      {/* ─── Productos: Bento grid ─── */}
      <section className="py-24 md:py-32 bg-warm-200/50">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="font-cormorant text-4xl md:text-5xl text-warm-900 mb-6">
              Productos para tu Nuevo Hogar
            </h2>
            <p className="text-warm-600 max-w-2xl mx-auto text-lg font-light">
              Tecnologia de vanguardia para la purificacion de aire, agua y
              nutricion superior.
            </p>
          </div>

          {caricoProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Featured: first product — large card */}
              {caricoProducts[0] && (
                <Link
                  href={`/tienda/${caricoProducts[0].id}`}
                  className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-2xl bg-white p-8 transition-all hover:shadow-xl cursor-pointer block"
                >
                  {caricoProducts[0].images?.[0] && (
                    <div className="relative w-full h-64 mb-8">
                      <Image
                        src={caricoProducts[0].images[0]}
                        alt={caricoProducts[0].name}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <h4 className="font-cormorant text-2xl text-warm-900">
                      {caricoProducts[0].name}
                    </h4>
                    <p className="text-warm-600 line-clamp-2">
                      {caricoProducts[0].description}
                    </p>
                  </div>
                </Link>
              )}

              {/* Second product — wide horizontal card */}
              {caricoProducts[1] && (
                <Link
                  href={`/tienda/${caricoProducts[1].id}`}
                  className="md:col-span-2 group relative overflow-hidden rounded-2xl bg-white p-8 transition-all hover:shadow-xl cursor-pointer flex gap-6 items-center"
                >
                  <div className="w-1/2">
                    {caricoProducts[1].images?.[0] && (
                      <div className="relative w-full aspect-square">
                        <Image
                          src={caricoProducts[1].images[0]}
                          alt={caricoProducts[1].name}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          sizes="25vw"
                        />
                      </div>
                    )}
                  </div>
                  <div className="w-1/2 space-y-2">
                    <h4 className="font-cormorant text-xl text-warm-900">
                      {caricoProducts[1].name}
                    </h4>
                    <p className="text-sm text-warm-600 line-clamp-2">
                      {caricoProducts[1].description}
                    </p>
                  </div>
                </Link>
              )}

              {/* Third and fourth products — small cards */}
              {caricoProducts.slice(2, 4).map((product) => (
                <Link
                  key={product.id}
                  href={`/tienda/${product.id}`}
                  className="group relative overflow-hidden rounded-2xl bg-white p-6 transition-all hover:shadow-xl cursor-pointer block"
                >
                  {product.images?.[0] && (
                    <div className="relative w-full aspect-square mb-4">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-500"
                        sizes="25vw"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <h4 className="font-cormorant text-lg text-warm-900">
                      {product.name}
                    </h4>
                    <p className="text-xs text-warm-600 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* Skeleton loading */
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="md:col-span-2 md:row-span-2 rounded-2xl bg-white p-8 animate-pulse">
                <div className="w-full h-64 bg-warm-200 rounded-xl mb-8" />
                <div className="h-6 bg-warm-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-warm-100 rounded w-full" />
              </div>
              <div className="md:col-span-2 rounded-2xl bg-white p-8 animate-pulse flex gap-6">
                <div className="w-1/2 aspect-square bg-warm-200 rounded-xl" />
                <div className="w-1/2 space-y-3 flex flex-col justify-center">
                  <div className="h-5 bg-warm-200 rounded w-3/4" />
                  <div className="h-4 bg-warm-100 rounded w-full" />
                </div>
              </div>
              <div className="rounded-2xl bg-white p-6 animate-pulse">
                <div className="w-full aspect-square bg-warm-200 rounded-xl mb-4" />
                <div className="h-4 bg-warm-200 rounded w-3/4" />
              </div>
              <div className="rounded-2xl bg-white p-6 animate-pulse">
                <div className="w-full aspect-square bg-warm-200 rounded-xl mb-4" />
                <div className="h-4 bg-warm-200 rounded w-3/4" />
              </div>
            </div>
          )}

          {/* CTA link */}
          <div className="mt-16 text-center">
            <Link
              href="/tienda?tab=catalogo"
              className="inline-flex items-center gap-4 text-warm-900 font-medium tracking-widest uppercase text-sm border-b-2 border-warm-300 pb-2 hover:border-warm-900 transition-all cursor-pointer"
            >
              Ver Catalogo Carico
              <HiOutlineBookOpen className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Final CTA: Full-width primary bg ─── */}
      <section className="py-24 md:py-32 bg-background text-text-main text-center relative overflow-hidden">
        {/* Subtle background image */}
        <div className="absolute inset-0 opacity-[0.06]">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDCfrKGFZKdR64TZOc11BAX0V2rcguo_UV2oZPcqI_lLapVnBvzGFtK3vjHm5mXnut0wqwqgNE_-Y9gnVm_2iTboQguMjqpspDjGAL6HagYFM8nwYrVPBYNyQhkyCKl6Woi6GgJIDiiHHT7wC_SZLEp7mH9Jv9tB2io6YciFjuLjcouRAzC_M0k5R48kTMTHRD1S0k9KDotw5NjUUw06UjwIJCOon2IW2paggM2htR0XE6C301J3HVIDSIGE88GNhPvLnp1Fe6XvE"
            alt=""
            className="w-full h-full object-cover"
            aria-hidden="true"
          />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto space-y-10">
            <h2 className="font-cormorant text-4xl md:text-6xl leading-tight">
              Construyan su hogar con bienestar desde el primer dia
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-5">
              <Link
                href={hasExistingPlan ? "/plan-novios/mi-plan" : "/plan-novios/registrar"}
                className="bg-primary text-white px-12 py-4 md:py-5 rounded-sm hover:bg-primary-hover transition-colors shadow-xl font-medium cursor-pointer"
              >
                {hasExistingPlan ? "Ver mi Plan Novios" : "Registra tu Plan Novios"}
              </Link>
              <a
                href="https://wa.me/593991712532?text=Hola%20Pau,%20quiero%20informacion%20sobre%20el%20Plan%20Novios%20Carico"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-text-main/25 text-text-main px-12 py-4 md:py-5 rounded-sm hover:bg-surface-elevated transition-colors font-medium cursor-pointer inline-flex items-center justify-center gap-2"
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

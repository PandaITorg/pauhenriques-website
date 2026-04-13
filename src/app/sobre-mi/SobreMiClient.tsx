"use client";

import { FaInstagram, FaPodcast } from "react-icons/fa";
import { HiOutlineShoppingBag } from "react-icons/hi2";
import { useInView } from "react-intersection-observer";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";

/* ─── Scroll-triggered fade block ─── */
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Photo with glow + rounded border (matches homepage AnimatedPhoto) ─── */
function GlowPhoto({
  src,
  alt,
  className = "",
}: {
  src: string | StaticImageData;
  alt: string;
  className?: string;
}) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
    >
      <div className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-lg hover:shadow-(--shadow-glow-primary) transition-shadow duration-500">
        <Image src={src} alt={alt} className="w-full h-auto" />
      </div>
    </div>
  );
}

/* ─── Video with glow frame (replaces old polaroid) ─── */
function GlowVideo() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-lg hover:shadow-(--shadow-glow-primary) transition-shadow duration-500">
        <video
          className="w-full h-auto"
          muted
          autoPlay
          loop
          playsInline
          src="https://res.cloudinary.com/dro8ckpco/video/upload/v1757636446/premiomapa_klw5lo.mp4"
          aria-describedby="video-description"
        >
          Tu navegador no soporta el tag de video.
        </video>
        <p id="video-description" className="sr-only">
          Video: Pau Henriques explica como transformar tu vida sin consumir
          medicinas.
        </p>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export default function SobreMiClient({
  pauSobreMi1,
  pauSobreMi2,
  pauForrest,
  jorgeYPau,
}: {
  pauSobreMi1: StaticImageData;
  pauSobreMi2: StaticImageData;
  pauForrest: StaticImageData;
  jorgeYPau: StaticImageData;
}) {
  return (
    <div className="bg-background min-h-screen">
      {/* ── Hero section with warm gradient ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-warm-950/60 via-background to-background" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 pt-14 pb-16 md:pt-24 md:pb-28 text-center">
          <FadeIn>
            <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/70 mb-3">
              Mi Historia
            </span>
            <h1 className="font-cormorant text-4xl sm:text-5xl md:text-6xl font-semibold text-text-main mb-4">
              Sobre{" "}
              <span className="font-dancing-script text-primary text-[1.1em]">
                Mi
              </span>
            </h1>
            <p className="text-base md:text-lg text-text-main/50 max-w-xl mx-auto leading-relaxed">
              Ingeniera comercial, coach de vida sin toxicos, mama y esposa.
              Descubre como transforme mi salud y ahora ayudo a otros a vivir
              mejor.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Separator ── */}
      <div className="h-px max-w-6xl mx-auto bg-linear-to-r from-transparent via-border-default to-transparent" />

      {/* ── Chapter: Mi Camino (origin story) ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-14">
          <div className="md:w-1/2 space-y-6">
            <FadeIn>
              <h2 className="font-cormorant text-2xl sm:text-3xl md:text-4xl font-semibold text-text-main">
                Mi{" "}
                <span className="font-dancing-script text-primary text-[1.15em]">
                  Camino
                </span>
              </h2>
            </FadeIn>
            <FadeIn delay={100}>
              <p className="text-base md:text-lg text-text-main/70 leading-relaxed">
                Hace 15 anos me diagnosticaron Psoriasis en la piel, una
                condicion &ldquo;incurable&rdquo; y en ese momento empezo mi
                interes por entender temas que van mas alla de un diagnostico.
              </p>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="text-base md:text-lg text-text-main/70 leading-relaxed">
                Tuve un gran despertar y una curiosidad incansable en aprender
                como poder sanar mi cuerpo de adentro para afuera. En como
                vivir un estilo de vida libre de toxicos.
              </p>
            </FadeIn>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <GlowPhoto
              src={pauForrest}
              alt="Pau Henriques en el bosque"
              className="max-w-xs sm:max-w-sm"
            />
          </div>
        </div>
      </section>

      {/* ── Separator ── */}
      <div className="h-px max-w-6xl mx-auto bg-linear-to-r from-transparent via-border-default to-transparent" />

      {/* ── Chapter: Junto a Jorge ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col-reverse md:flex-row items-center gap-10 md:gap-14">
          <div className="md:w-1/2 flex justify-center">
            <GlowPhoto
              src={jorgeYPau}
              alt="Jorge y Pau"
              className="max-w-xs sm:max-w-sm"
            />
          </div>
          <div className="md:w-1/2 space-y-6">
            <FadeIn>
              <h2 className="font-cormorant text-2xl sm:text-3xl md:text-4xl font-semibold text-text-main">
                Junto a{" "}
                <span className="font-dancing-script text-primary text-[1.15em]">
                  Jorge
                </span>
              </h2>
            </FadeIn>
            <FadeIn delay={100}>
              <p className="text-base md:text-lg text-text-main/70 leading-relaxed">
                Actualmente trabajo junto a mi companero de vida y esposo
                Jorge, liderando la Marca Carico en el Ecuador. Nos enfocamos
                en brindar una mejor salud y estilo de vida a todos nuestros
                clientes.
              </p>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="text-base md:text-lg text-text-main/70 leading-relaxed">
                Nuestra filosofia y nuestros productos han mejorado la salud y
                el estilo de vida que tenemos junto con el de cientos de
                clientes con testimonios de vida impactantes.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Separator ── */}
      <div className="h-px max-w-6xl mx-auto bg-linear-to-r from-transparent via-border-default to-transparent" />

      {/* ── Chapter: Mi Mision ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-14">
          <div className="md:w-1/2 space-y-6">
            <FadeIn>
              <h2 className="font-cormorant text-2xl sm:text-3xl md:text-4xl font-semibold text-text-main">
                Mi Mision: Un Hogar Consciente y Saludable
              </h2>
            </FadeIn>
            <FadeIn delay={100}>
              <p className="text-base md:text-lg text-text-main/70 leading-relaxed">
                A lo largo de mi vida he descubierto que la verdadera riqueza
                esta en la salud, y que cada decision que tomamos en nuestro
                hogar impacta directamente en el bienestar de nuestra familia.
                Mi pasion es ayudar a las personas a vivir mas conscientes,
                eliminando los toxicos que silenciosamente afectan nuestro
                cuerpo.
              </p>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="text-base md:text-lg text-text-main/70 leading-relaxed">
                Hoy desarrollo mi mision junto a Carico, una marca que
                representa innovacion, respaldo cientifico y confianza. Lo que
                hago no es vender productos, es compartir un estilo de vida que
                yo misma vivo en casa, porque estoy convencida de que cuando
                invertimos en salud, invertimos en lo mas valioso que tenemos.
              </p>
            </FadeIn>
          </div>
          <div className="md:w-1/2">
            <GlowVideo />
          </div>
        </div>
      </section>

      {/* ── Separator ── */}
      <div className="h-px max-w-6xl mx-auto bg-linear-to-r from-transparent via-border-default to-transparent" />

      {/* ── Chapter 2: Salud Natural ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col-reverse md:flex-row items-center gap-10 md:gap-14">
          <div className="md:w-1/2 flex justify-center gap-5">
            <GlowPhoto
              src={pauSobreMi1}
              alt="Pau Henriques en un entorno natural"
              className="w-40 sm:w-48 md:w-52"
            />
            <GlowPhoto
              src={pauSobreMi2}
              alt="Pau Henriques y Jorge en un evento de salud"
              className="w-40 sm:w-48 md:w-52 mt-8"
            />
          </div>
          <div className="md:w-1/2 space-y-6">
            <FadeIn>
              <h2 className="font-cormorant text-2xl sm:text-3xl md:text-4xl font-semibold text-text-main">
                Mejora tu salud y calidad de vida sin medicina
              </h2>
            </FadeIn>
            <FadeIn delay={100}>
              <p className="text-base md:text-lg text-text-main/70 leading-relaxed">
                Te ayudo a encontrar soluciones en tu salud fuera de
                consultorios y recetas medicas, entendiendo tu cuerpo, sus
                reacciones y como poder sanarlo de forma natural e integral
                libre de toxinas.
              </p>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="text-base md:text-lg text-text-main/70 leading-relaxed">
                Quieres inspiracion diaria y consejos de salud? Sigueme en
                Instagram o explora productos para tu bienestar.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Separator ── */}
      <div className="h-px max-w-6xl mx-auto bg-linear-to-r from-transparent via-border-default to-transparent" />

      {/* ── CTA Section ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-16 md:py-24">
        <FadeIn>
          <div className="bg-surface-card border border-border-subtle rounded-2xl p-8 sm:p-10 md:p-14 text-center">
            <h2 className="font-cormorant text-2xl sm:text-3xl md:text-4xl font-semibold text-text-main mb-4">
              Conecta{" "}
              <span className="font-dancing-script text-primary text-[1.1em]">
                Conmigo
              </span>
            </h2>
            <p className="text-text-main/50 mb-8 max-w-md mx-auto">
              Explora mi tienda, escucha mi podcast o sigueme en redes para
              contenido diario sobre vida sin toxicos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/tienda"
                className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 hover:-translate-y-px hover:shadow-(--shadow-glow-primary) inline-flex items-center justify-center gap-2"
              >
                <HiOutlineShoppingBag className="w-5 h-5" />
                Ir a la Tienda
              </Link>
              <a
                href="https://www.instagram.com/pau_henriques/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto border border-primary/40 text-primary font-semibold py-3 px-8 rounded-xl transition-all duration-200 hover:bg-primary/10 inline-flex items-center justify-center gap-2"
              >
                <FaInstagram className="w-4 h-4" />
                Ir a Instagram
              </a>
              <Link
                href="/podcast"
                className="w-full sm:w-auto border border-border-default text-text-main/60 font-semibold py-3 px-8 rounded-xl transition-all duration-200 hover:bg-surface-elevated hover:text-text-main inline-flex items-center justify-center gap-2"
              >
                <FaPodcast className="w-4 h-4" />
                Mi Podcast
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}

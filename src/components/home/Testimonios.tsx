"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { FaStar } from "react-icons/fa";

import cinthyaImg from "@/assets/cinthya - testimonio.jpeg";
import danielaImg from "@/assets/daniela - testimonio.jpeg";
import marianaImg from "@/assets/mariana - testimonio.jpg";
import monicaImg from "@/assets/monica - testimonio.jpeg";
import sylvannaImg from "@/assets/sylvanna - testimonio.jpeg";

interface Testimonial {
  name: string;
  title: string;
  text: string;
  image: any;
  product: string;
}

const originalTestimonials: Testimonial[] = [
  {
    name: "Daniela",
    title: "Diseñadora Gráfica",
    text: "Mi sueño ha mejorado significativamente, duermo profundo sin interrupciones y me levanto descansada y sin dolor.",
    image: danielaImg,
    product: "Sistema de Descanso Carico",
  },
  {
    name: "Mariana",
    title: "",
    text: "Desde que duermo en el sistema de descanso Carico, concilio el sueño enseguida, me levanto descansada, ya puedo decir que duermo.",
    image: marianaImg,
    product: "Sistema de Descanso Carico",
  },
  {
    name: "Mónica",
    title: "",
    text: "Me ha simplificado la vida. Sirve para todo, desde aspirar mis muebles y alfombras hasta realizar limpiezas profundas a baños.",
    image: monicaImg,
    product: "Clean Machine Carico",
  },
  {
    name: "Silvana",
    title: "Experta en Sistema Hormonal",
    text: "Estoy feliz. Se siente un agua pura y llena de minerales, eliminé el consumo de botellones que también contaminaban.",
    image: sylvannaImg,
    product: "Filtro de agua Carico",
  },
  {
    name: "Cinthya",
    title: "",
    text: "La diferencia del agua en mi piel fue inmediata. Mejoró mi digestión, mi pelo, ya no tengo frizz, y ya no tengo alergia en la piel.",
    image: cinthyaImg,
    product: "Filtro de agua Carico",
  },
];

const shuffleArray = (array: Testimonial[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const Stars = () => (
  <div className="flex gap-0.5 mb-3">
    {[...Array(5)].map((_, i) => (
      <FaStar key={i} className="w-3.5 h-3.5 text-primary" />
    ))}
  </div>
);

const TestimonialCard = React.forwardRef<
  HTMLDivElement,
  { testimonial: Testimonial }
>(({ testimonial }, ref) => (
  <div
    ref={ref}
    className="bg-warm-800 border border-border-warm rounded-xl p-5 sm:p-6 shrink-0 w-72 sm:w-80 md:w-88"
  >
    {/* Quote mark */}
    <div className="font-cormorant text-5xl leading-none text-primary/15 select-none mb-1">
      &ldquo;
    </div>

    <Stars />

    <p className="text-sm sm:text-base text-text-main/75 italic leading-relaxed mb-5">
      {testimonial.text}
    </p>

    <div className="flex items-center gap-3 pt-3 border-t border-border-warm">
      <Image
        src={testimonial.image}
        alt={testimonial.name}
        width={44}
        height={44}
        className="w-11 h-11 rounded-full object-cover border-2 border-warm-600"
      />
      <div className="min-w-0">
        <h3 className="font-semibold text-sm text-text-main">
          {testimonial.name}
        </h3>
        {testimonial.title && (
          <p className="text-xs text-text-main/45">{testimonial.title}</p>
        )}
        <p className="text-xs text-primary/60 mt-0.5">
          {testimonial.product}
        </p>
      </div>
    </div>
  </div>
));
TestimonialCard.displayName = "TestimonialCard";

const Testimonios: React.FC = () => {
  const [visibleTestimonials, setVisibleTestimonials] = useState<Testimonial[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const scrollX = useRef<number>(0);
  const isPaused = useRef<boolean>(false);
  const animationSpeed = 0.25;

  useEffect(() => {
    const actualTestimonials = shuffleArray(originalTestimonials);
    setVisibleTestimonials([
      ...actualTestimonials,
      ...actualTestimonials,
      ...actualTestimonials,
    ]);
  }, []);

  const animateScroll = useCallback(() => {
    if (!scrollerRef.current || !cardRef.current || isPaused.current) {
      animationFrameId.current = requestAnimationFrame(animateScroll);
      return;
    }

    const cardWidth = cardRef.current.offsetWidth + 16;
    if (cardWidth <= 16) {
      animationFrameId.current = requestAnimationFrame(animateScroll);
      return;
    }

    scrollX.current += animationSpeed;

    const totalOriginalWidth = cardWidth * originalTestimonials.length;
    if (scrollX.current >= totalOriginalWidth) {
      scrollX.current -= totalOriginalWidth;
    }

    scrollerRef.current.style.transform = `translateX(-${scrollX.current}px)`;
    animationFrameId.current = requestAnimationFrame(animateScroll);
  }, [animationSpeed]);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(animateScroll);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [animateScroll]);

  return (
    <section className="bg-warm-900 py-16 md:py-24">
      {/* Header */}
      <div className="container mx-auto text-center mb-10 md:mb-14 px-5">
        <h2 className="font-cormorant text-3xl md:text-4xl font-semibold text-text-main">
          Testimonios que{" "}
          <span className="font-dancing-script text-primary text-[1.1em]">
            Inspiran
          </span>
        </h2>
        <p className="text-base text-text-main/50 mt-2">
          Historias reales de cambios de vida
        </p>
      </div>

      {/* Scrolling carousel */}
      <div
        className="w-full overflow-hidden relative"
        onMouseEnter={() => { isPaused.current = true; }}
        onMouseLeave={() => { isPaused.current = false; }}
        onTouchStart={() => { isPaused.current = true; }}
        onTouchEnd={() => { isPaused.current = false; }}
      >
        <div
          ref={scrollerRef}
          className="flex gap-4"
          style={{ transform: `translateX(-${scrollX.current}px)` }}
        >
          {visibleTestimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              testimonial={testimonial}
              ref={index === 0 ? cardRef : null}
            />
          ))}
        </div>

        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 pointer-events-none bg-linear-to-r from-warm-900 to-transparent w-8 sm:w-16 md:w-24" />
        <div className="absolute inset-y-0 right-0 pointer-events-none bg-linear-to-l from-warm-900 to-transparent w-8 sm:w-16 md:w-24" />
      </div>
    </section>
  );
};

export default Testimonios;

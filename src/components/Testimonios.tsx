"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

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
    title: "Disenadora Grafica",
    text: "Mi sueno ha mejorado significativamente, duermo profundo sin interrupciones y me levanto descansada y sin dolor.",
    image: danielaImg,
    product: "Sistema de Descanso Carico",
  },
  {
    name: "Mariana",
    title: "",
    text: "Desde que duermo en el sistema de descanso Carico, concilio el sueno enseguida, me levanto descansada, ya puedo decir que duermo.",
    image: marianaImg,
    product: "Sistema de Descanso Carico",
  },
  {
    name: "Monica",
    title: "",
    text: "Me ha simplificado la vida. Sirve para todo, desde aspirar mis muebles y alfombras hasta realizar limpiezas profundas a banos.",
    image: monicaImg,
    product: "Clean Machine Carico",
  },
  {
    name: "Silvana",
    title: "Experta en Sistema Hormonal",
    text: "Estoy feliz. Se siente un agua pura y llena de minerales, elimine el consumo de botellones que tambien contaminaban.",
    image: sylvannaImg,
    product: "Filtro de agua Carico",
  },
  {
    name: "Cinthya",
    title: "",
    text: "La diferencia del agua en mi piel fue inmediata. Mejoro mi digestion, mi pelo, ya no tengo frizz, y ya no tengo alergia en la piel.",
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

const TestimonialCard = React.forwardRef<
  HTMLDivElement,
  { testimonial: Testimonial }
>(({ testimonial }, ref) => (
  <div
    ref={ref}
    className="bg-white rounded-xl shadow-lg p-5 sm:p-6 shrink-0 w-70 sm:w-80 md:w-90"
  >
    <div className="flex items-center mb-4">
      <Image
        src={testimonial.image}
        alt={testimonial.name}
        width={56}
        height={56}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shadow-md mr-3 sm:mr-4"
      />
      <div className="min-w-0">
        <h3 className="font-bold text-base sm:text-lg text-gray-800">
          {testimonial.name}
        </h3>
        {testimonial.title && (
          <p className="text-sm text-gray-500">{testimonial.title}</p>
        )}
        {testimonial.product && (
          <p className="text-xs text-gray-400 mt-0.5">
            {testimonial.product}
          </p>
        )}
      </div>
    </div>
    <p className="text-sm sm:text-base text-gray-600 italic leading-relaxed">
      &ldquo;{testimonial.text}&rdquo;
    </p>
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

    const cardWidth = cardRef.current.offsetWidth + 16; // gap-4 = 16px
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
    <section className="bg-background py-12 md:py-24">
      <div className="container mx-auto text-center mb-8 md:mb-12 px-5">
        <h2 className="text-3xl md:text-4xl font-bold text-text-main">
          Testimonios que Inspiran
        </h2>
        <p className="text-base md:text-lg text-text-main/60 mt-2">
          Historias reales de cambios de vida
        </p>
      </div>

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
        <div className="absolute inset-y-0 left-0 pointer-events-none bg-linear-to-r from-background to-transparent w-8 sm:w-16 md:w-24" />
        <div className="absolute inset-y-0 right-0 pointer-events-none bg-linear-to-l from-background to-transparent w-8 sm:w-16 md:w-24" />
      </div>
    </section>
  );
};

export default Testimonios;

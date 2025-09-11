import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useMediaQuery } from "../hooks/useMediaQuery";
import ramaIzquierda from "../assets/rama-izquierda.svg";
import ramaDerecha from "../assets/rama-derecha.svg";

import cinthyaImg from "../assets/cinthya - testimonio.jpeg";
import danielaImg from "../assets/daniela - testimonio.jpeg";
import marianaImg from "../assets/mariana - testimonio.jpg";
import monicaImg from "../assets/monica - testimonio.jpeg";
import sylvannaImg from "../assets/sylvanna - testimonio.jpeg";

interface Testimonial {
  name: string;
  title: string;
  text: string;
  image: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Daniela",
    title: "Diseñadora Gráfica",
    text: "Mi sueño ha mejorado significativamente, duermo profundo sin interrupciones y me levanto descansada y sin dolor.",
    image: danielaImg,
  },
  {
    name: "Mariana",
    title: "",
    text: "Desde que duermo en el sistema de descanso Carico, concilio el sueño enseguida, me levanto descansada, ya puedo decir que duermo.",
    image: marianaImg,
  },
  {
    name: "Mónica",
    title: "",
    text: "Me ha simplificado la vida. Sirve para todo, desde aspirar mis muebles y alfombras hasta realizar limpiezas profundas a baños.",
    image: monicaImg,
  },
  {
    name: "Silvana",
    title: "Experta en Sistema Hormonal",
    text: "Estoy feliz. Se siente un agua pura y llena de minerales, eliminé el consumo de botellones que también contaminaban.",
    image: sylvannaImg,
  },
  {
    name: "Cinthya",
    title: "",
    text: "La diferencia del agua en mi piel fue inmediata. Mejoró mi digestión, mi pelo, ya no tengo frizz, y ya no tengo alergia en la piel.",
    image: cinthyaImg,
  },
];

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => (
  <div className="testimonial-card">
    <img
      src={testimonial.image}
      alt={testimonial.name}
      className="w-20 h-20 rounded-full object-cover shadow-lg mx-auto mb-4"
    />
    <p className="text-base text-text-inverted italic mb-3">
      "{testimonial.text}"
    </p>
    <h3 className="font-bold text-text-inverted">{testimonial.name}</h3>
    {testimonial.title && (
      <p className="text-sm text-gray-600">{testimonial.title}</p>
    )}
  </div>
);

const Testimonios = () => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeBranch, setActiveBranch] = useState("left");
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const visibleDuration = 6000; // 6 seconds
    const animationDuration = 2000; // 2 seconds for grow/retract animation

    let retractTimer, nextTimer;

    if (isDesktop) {
      // Desktop: Both branches grow and retract, showing two testimonials.
      retractTimer = setTimeout(() => {
        setIsAnimating(false); // Retract
      }, visibleDuration);

      nextTimer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 2) % testimonials.length);
        setIsAnimating(true); // Grow again
      }, visibleDuration + animationDuration);
    } else {
      // Mobile: Branches alternate.
      retractTimer = setTimeout(() => {
        setIsAnimating(false); // Retract
      }, visibleDuration);

      nextTimer = setTimeout(() => {
        const nextBranch = activeBranch === "left" ? "right" : "left";
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        setActiveBranch(nextBranch);
        setIsAnimating(true); // Grow next branch
      }, visibleDuration + animationDuration);
    }

    return () => {
      clearTimeout(retractTimer);
      clearTimeout(nextTimer);
    };
  }, [activeBranch, currentIndex, isDesktop]);

  const animationClass = isAnimating ? "grow" : "retract";

  return (
    <section className="bg-background pb-40 relative overflow-hidden min-h-[45rem]">
      {isDesktop ? (
        <>
          <div
            className={`testimonial-branch-container left ${animationClass}`}
          >
            <img
              src={ramaIzquierda}
              alt="rama izquierda"
              className="branch-svg"
            />
            <TestimonialCard testimonial={testimonials[currentIndex]} />
          </div>
          <div
            className={`testimonial-branch-container right ${animationClass}`}
          >
            <img src={ramaDerecha} alt="rama derecha" className="branch-svg" />
            <TestimonialCard
              testimonial={
                testimonials[(currentIndex + 1) % testimonials.length]
              }
            />
          </div>
        </>
      ) : (
        <div
          className={`testimonial-branch-container ${activeBranch} ${animationClass}`}
        >
          <img
            src={activeBranch === "left" ? ramaIzquierda : ramaDerecha}
            alt={`rama ${activeBranch}`}
            className="branch-svg"
          />
          <TestimonialCard testimonial={testimonials[currentIndex]} />
        </div>
      )}

      <div className="container mx-auto px-4 text-center absolute bottom-0 left-0 right-0 pb-10">
        <Link
          to="/tienda"
          className="inline-block bg-primary text-white font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out hover:brightness-110 hover:scale-105 active:scale-95 transform"
        >
          Cambia tu vida sin tóxicos
        </Link>
      </div>
    </section>
  );
};

export default Testimonios;

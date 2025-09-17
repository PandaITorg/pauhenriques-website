import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- ASSETS ---
import cinthyaImg from "../assets/cinthya - testimonio.jpeg";
import danielaImg from "../assets/daniela - testimonio.jpeg";
import marianaImg from "../assets/mariana - testimonio.jpg";
import monicaImg from "../assets/monica - testimonio.jpeg";
import sylvannaImg from "../assets/sylvanna - testimonio.jpeg";

// --- DATA ---
interface Testimonial {
  name: string;
  title: string;
  text: string;
  image: string;
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

// Placeholder for blank cards
const blankTestimonial: Testimonial = {
  name: "",
  title: "",
  text: "",
  image: "", // Or a placeholder image URL
  product: "",
};

// --- HELPER FUNCTIONS ---
const shuffleArray = (array: Testimonial[]) => {
  let currentIndex = array.length, randomIndex;
  const newArray = [...array];
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
  }
  return newArray;
};

// --- CARD COMPONENT ---
const TestimonialCard = React.forwardRef<HTMLDivElement, { testimonial: Testimonial, isBlank?: boolean }>(({ testimonial, isBlank }, ref) => (
  <div 
    ref={ref}
    className="bg-white rounded-xl shadow-lg p-6 flex-shrink-0 w-[18.75rem] md:w-[23.75rem] mx-4"
  >
    {isBlank ? (
      <div className="h-full flex items-center justify-center text-gray-400 italic">
        Cargando testimonio...
      </div>
    ) : (
      <>
        <div className="flex items-center mb-4">
          <img
            src={testimonial.image}
            alt={testimonial.name}
            className="w-16 h-16 rounded-full object-cover shadow-md mr-4"
          />
          <div>
            <h3 className="font-bold text-lg text-gray-800">
              {testimonial.name}
            </h3>
            {testimonial.title && (
              <p className="text-sm text-gray-500">{testimonial.title}</p>
            )}
            {testimonial.product && (
              <p className="text-xs text-gray-400 mt-1">{testimonial.product}</p>
            )}
          </div>
        </div>
        <p className="text-base text-gray-600 italic">
          “{testimonial.text}”
        </p>
      </>
    )}
  </div>
));

// --- MAIN COMPONENT ---
const Testimonios: React.FC = () => {
  const [visibleTestimonials, setVisibleTestimonials] = useState<Testimonial[]>(
    []
  );
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null); // Ref to measure a single card
  const animationFrameId = useRef<number | null>(null);
  const scrollX = useRef<number>(0);
  const isPaused = useRef<boolean>(false);
  const animationSpeed = 0.25; // pixels per frame
  const numInitialCards = 5; // Number of cards to display initially

  // Initialize visible testimonials and measure card width
  useEffect(() => {
    // Fill with blank cards initially
    const initialBlanks = Array(numInitialCards).fill(blankTestimonial);
    setVisibleTestimonials(initialBlanks);

    // After initial render, replace with actual testimonials and add duplicates for seamless loop
    const setupTestimonials = () => {
      const actualTestimonials = shuffleArray(originalTestimonials);
      // Duplicate enough testimonials to fill the screen and beyond for seamless loop
      const loopTestimonials = [
        ...actualTestimonials,
        ...actualTestimonials,
        ...actualTestimonials,
      ];
      setVisibleTestimonials(loopTestimonials);
    };

    // Measure card width after initial render
    const measureCardWidth = () => {
      if (cardRef.current) {
        // Store card width including margin (mx-4 adds 16px total horizontal margin)
        const width = cardRef.current.offsetWidth + 32; // 16px for each mx-4
        cardRef.current.dataset.cardWidth = width.toString();
      }
    };

    // Use a timeout to ensure DOM is ready for measurement
    const timeoutId = setTimeout(() => {
      setupTestimonials();
      measureCardWidth();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  // Animation loop
  const animateScroll = useCallback(() => {
    if (!scrollerRef.current || !cardRef.current || isPaused.current) {
      animationFrameId.current = requestAnimationFrame(animateScroll); // Keep requesting if paused
      return;
    }

    const cardWidth = parseFloat(cardRef.current.dataset.cardWidth || "0");
    if (cardWidth === 0) {
      animationFrameId.current = requestAnimationFrame(animateScroll); // Wait for width measurement
      return;
    }

    scrollX.current += animationSpeed;

    // If we've scrolled past one full set of original testimonials, reset position
    // This creates the seamless loop
    const totalOriginalWidth = cardWidth * originalTestimonials.length;
    if (scrollX.current >= totalOriginalWidth) {
      scrollX.current -= totalOriginalWidth;
    }

    scrollerRef.current.style.transform = `translateX(-${scrollX.current}px)`;
    animationFrameId.current = requestAnimationFrame(animateScroll);
  }, [animationSpeed]);

  // Start/stop animation on mount/unmount and pause state change
  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(animateScroll);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [animateScroll]);

  // Pause/Resume on hover (desktop) and touch (mobile)
  const handleMouseEnter = () => {
    isPaused.current = true;
  };
  const handleMouseLeave = () => {
    isPaused.current = false;
  };
  const handleTouchStart = () => {
    isPaused.current = true;
  };
  const handleTouchEnd = () => {
    isPaused.current = false;
  };

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto text-center mb-12">
        <h2 className="text-4xl font-bold text-text-main">
          Testimonios que Inspiran
        </h2>
        <p className="text-lg text-text-secondary mt-2">
          Historias reales de cambios de vida
        </p>
      </div>

      <div
        className="scroller-container w-full overflow-hidden relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={scrollerRef}
          className="scroller-inner flex gap-8"
          style={{ transform: `translateX(-${scrollX.current}px)` }}
        >
          {visibleTestimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index} // Using index as key is okay here because items are not reordered, only shifted
              testimonial={testimonial}
              isBlank={testimonial.name === ""} // Check if it's a blank card
              ref={index === 0 ? cardRef : null} // Only attach ref to the first card for measurement
            />
          ))}
        </div>
        {/* Gradient overlay to hide abrupt edges */}
        <div className="absolute inset-y-0 left-0 pointer-events-none bg-gradient-to-r from-background to-transparent w-1/4 md:w-1/6"></div>
        <div className="absolute inset-y-0 right-0 pointer-events-none bg-gradient-to-l from-background to-transparent w-1/4 md:w-1/6"></div>
      </div>
    </section>
  );
};

export default Testimonios;
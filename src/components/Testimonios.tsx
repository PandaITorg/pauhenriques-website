import { useState, useEffect } from 'react';
import ramaIzquierda from '../assets/rama-izquierda.svg';
import ramaDerecha from '../assets/rama-derecha.svg';

import cinthyaImg from '../assets/cinthya - testimonio.jpeg';
import danielaImg from '../assets/daniela - testimonio.jpeg';
import marianaImg from '../assets/mariana - testimonio.jpg';
import monicaImg from '../assets/monica - testimonio.jpeg';
import sylvannaImg from '../assets/sylvanna - testimonio.jpeg';

const testimonials = [
  {
    name: 'Daniela',
    title: 'Diseñadora Gráfica',
    text: 'Mi sueño ha mejorado significativamente, duermo profundo sin interrupciones y me levanto descansada y sin dolor.',
    image: danielaImg,
  },
  {
    name: 'Mariana',
    title: '',
    text: 'Desde que duermo en el sistema de descanso Carico, concilio el sueño enseguida, me levanto descansada, ya puedo decir que duermo.',
    image: marianaImg,
  },
  {
    name: 'Mónica',
    title: '',
    text: 'Me ha simplificado la vida. Sirve para todo, desde aspirar mis muebles y alfombras hasta realizar limpiezas profundas a baños.',
    image: monicaImg,
  },
  {
    name: 'Silvana',
    title: 'Experta en Sistema Hormonal',
    text: 'Estoy feliz. Se siente un agua pura y llena de minerales, eliminé el consumo de botellones que también contaminaban.',
    image: sylvannaImg,
  },
  {
    name: 'Cinthya',
    title: '',
    text: 'La diferencia del agua en mi piel fue inmediata. Mejoró mi digestión, mi pelo, ya no tengo frizz, y ya no tengo alergia en la piel.',
    image: cinthyaImg,
  },
];

const Testimonios = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeBranch, setActiveBranch] = useState('left'); // 'left' or 'right'
  const [isAnimating, setIsAnimating] = useState(true); // true = grow, false = retract

  useEffect(() => {
    const visibleDuration = 6000; // 6 seconds
    const animationDuration = 2000; // 2 seconds for grow/retract animation

    // After the visible time, start the retraction animation
    const retractTimer = setTimeout(() => {
      setIsAnimating(false); // Triggers .retract class
    }, visibleDuration);

    // After retraction is done, switch to the next branch
    const nextBranchTimer = setTimeout(() => {
      const nextBranch = activeBranch === 'left' ? 'right' : 'left';
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
      setActiveBranch(nextBranch);
      setIsAnimating(true); // Triggers .grow class for the new branch
    }, visibleDuration + animationDuration);

    // Cleanup timers on component unmount or when activeBranch changes
    return () => {
      clearTimeout(retractTimer);
      clearTimeout(nextBranchTimer);
    };
  }, [activeBranch]);

  const currentTestimonial = testimonials[currentIndex];
  const branch = activeBranch === 'left' ? ramaIzquierda : ramaDerecha;
  const animationClass = isAnimating ? 'grow' : 'retract';

  return (
    <section className="bg-background py-20 relative overflow-hidden min-h-[40rem]">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-text-main mb-24">Testimonios que Inspiran</h2>
        
        <div
          className={`testimonial-branch-container ${activeBranch} ${animationClass}`}
        >
          <img src={branch} alt={`rama ${activeBranch}`} className="branch-svg" />
          <div className="testimonial-card">
            <img
              src={currentTestimonial.image}
              alt={currentTestimonial.name}
              className="w-20 h-20 rounded-full object-cover shadow-lg mx-auto mb-4"
            />
            <p className="text-base text-text-inverted italic mb-3">"{currentTestimonial.text}"</p>
            <h3 className="font-bold text-text-inverted">{currentTestimonial.name}</h3>
            {currentTestimonial.title && <p className="text-sm text-gray-600">{currentTestimonial.title}</p>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonios;
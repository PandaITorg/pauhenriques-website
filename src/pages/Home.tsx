
import PauImage from '../assets/pau-no-bg.png';
import marcoSuperior from '../assets/marco-superior.svg';
import marcoInferior from '../assets/marco-inferior.svg';
import marcoDerecho from '../assets/marco-derecho.svg';

const MistDivider = () => (
  <div className="absolute bottom-0 left-0 w-full h-48 z-50 pointer-events-none -mb-1">
    <div className="absolute inset-0" style={{ animation: 'flow-mist 20s linear infinite' }}>
      <svg viewBox="0 0 2000 150" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-[200%] h-full">
        <path d="M0 100 C 400 150, 600 100, 1000 100 S 1600 50, 2000 100 L 2000 150 L 0 150 Z" fill="#343d2a" opacity="0.8"></path>
      </svg>
    </div>
    <div className="absolute inset-0" style={{ animation: 'flow-mist 30s linear infinite reverse' }}>
        <svg viewBox="0 0 2000 150" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-[200%] h-full">
            <path d="M0 100 C 350 50, 650 100, 1000 100 S 1700 150, 2000 100 L 2000 150 L 0 150 Z" fill="#414934" opacity="0.6"></path>
        </svg>
    </div>
  </div>
);


export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <section className="relative min-h-[calc(100vh-5rem)] flex items-end">
        {/* Background elements */}
        <div className="absolute inset-0 animated-gradient-bg z-0"></div>
        
        {/* Adaptive SVG Frame */}
        <img src={marcoSuperior} alt="Marco superior" className="absolute top-0 left-0 w-full h-auto z-10 pointer-events-none" />
        <img src={marcoInferior} alt="Marco inferior" className="absolute bottom-0 left-0 w-full h-auto z-10 pointer-events-none" />
        <img src={marcoDerecho} alt="Marco derecho" className="absolute top-0 right-0 h-full w-auto z-0 pointer-events-none" />

        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div 
            className="absolute w-24 h-[200%] bg-gradient-to-b from-white to-transparent opacity-5 -top-1/2 left-1/4 transform -rotate-12"
            style={{ animation: 'shimmer 20s linear infinite' }}
          ></div>
          <div 
            className="absolute w-32 h-[200%] bg-gradient-to-b from-white to-transparent opacity-5 -top-1/2 left-3/4 transform -rotate-12"
            style={{ animation: 'shimmer 20s linear infinite', animationDelay: '5s' }}
          ></div>
          <div 
            className="absolute w-16 h-[200%] bg-gradient-to-b from-white to-transparent opacity-5 -top-1/2 left-1/2 transform rotate-12"
            style={{ animation: 'shimmer 20s linear infinite', animationDelay: '2s' }}
          ></div>
          <div 
            className="absolute w-20 h-[200%] bg-gradient-to-b from-white to-transparent opacity-5 -top-1/2 left-1/3 transform rotate-15"
            style={{ animation: 'shimmer 20s linear infinite', animationDelay: '8s' }}
          ></div>
          <div 
            className="absolute w-28 h-[200%] bg-gradient-to-b from-white to-transparent opacity-5 -top-1/2 left-2/3 transform -rotate-15"
            style={{ animation: 'shimmer 20s linear infinite', animationDelay: '12s' }}
          ></div>
        </div>

        {/* Main content grid for text alignment */}
        <div className="relative container mx-auto px-4 z-40 flex flex-col md:flex-row md:items-center md:justify-between">
          {/* Text column */}
          <div className="w-full md:w-1/2 text-center md:text-left flex-grow pb-8 md:pb-12">
             <h1 className="text-5xl md:text-7xl font-bold text-text-main font-mono text-shadow-dark">
                <span className="inline-block">
                  <span className="inline-block overflow-hidden whitespace-nowrap border-r-4 border-r-primary pr-1"
                    style={{ animation: 'typing 1s steps(6, end), blink 0.75s step-end 2 forwards' }}>
                    Hola!
                  </span>
                </span>
                <br/>
                <span className="inline-block mt-2">
                  <span className="inline-block overflow-hidden whitespace-nowrap border-r-4 border-r-primary pr-2 pb-2 opacity-0"
                    style={{ animation: 'fadeIn 0.1s 1.7s forwards, typing 1.5s steps(11, end) 1.7s forwards, blink 0.75s step-end 3 1.7s forwards' }}>
                    Yo soy <span className="text-primary">Pau</span>
                  </span>
                </span>
              </h1>
              <p 
                className="text-xl text-secondary mt-6 max-w-lg mx-auto md:mx-0 opacity-0"
                style={{ animation: 'fadeInUp 1s 3.5s ease-out forwards' }}
              >
                Ingeniera comercial experta en salud integral con certificaciones en Nutrición, anti-aging y vida sin tóxicos.
              </p>
              <div 
                className="mt-8 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 opacity-0"
                style={{ animation: 'fadeInUp 1s 3.7s ease-out forwards' }}
              >
                <a href="/productos" className="bg-background text-text-main font-bold py-3 px-8 rounded-lg transition-all duration-300 ease-in-out hover:brightness-125 hover:scale-105 active:scale-95 transform">
                  Ve a mi tienda
                </a>
                <a href="#sobre-mi" className="bg-transparent border-2 border-secondary text-secondary font-bold py-3 px-8 rounded-lg transition-all duration-300 ease-in-out hover:bg-secondary hover:text-text-main hover:scale-105 active:scale-95 transform">
                  Sobre Mí
                </a>
                <a href="/contacto" className="bg-transparent border-2 border-secondary text-secondary font-bold py-3 px-8 rounded-lg transition-all duration-300 ease-in-out hover:bg-secondary hover:text-text-main hover:scale-105 active:scale-95 transform">
                  Contáctame
                </a>
              </div>
            </div>

          {/* Pau's Image Column */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-start items-end">
             <img 
                src={PauImage} 
                alt="Pau Henriques" 
                className="w-full h-auto max-w-md md:max-w-none opacity-0"
                style={{ animation: 'fadeInUp 1s 0.2s ease-out forwards' }}
              />
          </div>
          </div>
          
          

          <MistDivider />
      </section>

      <section id="sobre-mi" className="bg-header-bg py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-text-inverted mb-4">Sobre Mí</h2>
          <p className="text-lg text-text-inverted max-w-3xl mx-auto">
            Aquí va el texto sobre Pau Henriques. Una descripción de su historia, su misión y su pasión por la vida sin tóxicos.
          </p>
        </div>
      </section>
    </div>
  );
}
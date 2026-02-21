"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaVolumeUp,
  FaVolumeMute,
} from "react-icons/fa";

// --- DATA STRUCTURES ---
interface CtaItem {
  text: string;
  link: string;
}

interface VideoItem {
  videoUrl: string;
  title: string;
  description: string;
  ctas: CtaItem[];
}

// --- COMPONENT DATA ---
const videoData: VideoItem[] = [
  {
    videoUrl:
      "https://res.cloudinary.com/dro8ckpco/video/upload/v1757608465/Mala_circulaci%C3%B3n_Varices_Piernas_cansadas_Si_tu_sangre_no_circula_bien_no_solo_se_sienten_la_re5rqo.mp4",
    title: "Colchón Earthing Carico",
    description:
      "Conéctate con la energía de la tierra mientras duermes. Nuestro sistema de descanso Earthing está diseñado para mejorar tu circulación, reducir la inflamación y promover un sueño profundo y reparador.",
    ctas: [
      {
        text: "Sistema de descanso",
        link: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20el%20descanso%20con%20tecnolog%C3%ADa%20earthing%20,%20soy:%20%20",
      },
    ],
  },
  {
    videoUrl:
      "https://res.cloudinary.com/dro8ckpco/video/upload/v1757608463/%EF%B8%8FSi_tus_sart%C3%A9nes_se_ven_as%C3%AD_o_as%C3%ADTe_van_a_causar_grandes_problemas_hormonales_%EF%B8%8FSartenes_de_t_bepzre.mp4",
    title: "Ollas de Acero Quirúrgico",
    description:
      "Deja de preocuparte por los tóxicos. Nuestras ollas de acero quirúrgico 3 - 16 únicas con titanio te permiten cocinar de manera segura, preservando el sabor y los nutrientes de tus alimentos sin liberar químicos.",
    ctas: [
      {
        text: "Cocina con Acero Quirúrgico 3 - 16",
        link: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20%22Acero%20Quirurgico%22,%20soy:%20%20",
      },
    ],
  },
  {
    videoUrl:
      "https://res.cloudinary.com/dro8ckpco/video/upload/v1757608462/Sigues_comprando_botellones_%EF%B8%8F_Caros_pesados_sin_minerales_y_expuestos_al_sol.La_realidad_ghybiy.mp4",
    title: "Purificador de Agua Carico",
    description:
      "El agua es vida, y la tuya debe ser pura. Olvídate de los botellones y disfruta de agua alcalina, libre de químicos, metales pesados, bacterias y contaminantes, directamente desde tu grifo.",
    ctas: [
      {
        text: "Bebe sin tóxicos",
        link: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20el%20purificador%20de%20agua,%20soy:%20%20",
      },
    ],
  },
  {
    videoUrl:
      "https://res.cloudinary.com/dro8ckpco/video/upload/v1757608461/El_moho_es_un_enemigo_silencioso_en_tu_hogar_No_solo_mancha_las_paredes-_sus_esporas_viajan_z6eqbi.mp4",
    title: "Sistema de limpieza y desinfecciones",
    description:
      "Elimina el uso de químicos de limpieza tóxicos y deshazte de tu trapeador. Tenemos el sistema de limpieza más avanzado y revolucionario que aspira y limpia con vapor a un nuevo nivel.",
    ctas: [
      {
        text: "Clean Machine",
        link: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20la%20clean%20machine,%20soy:%20%20",
      },
    ],
  },
  {
    videoUrl:
      "https://res.cloudinary.com/dro8ckpco/video/upload/v1757613259/El_uso_de_mascarilla_es_una_medida_efectiva_pero_no_infalible_Puede_reducir_el_riesgo_de_contagio_ekpvxz.mp4",
    title: "Purificador de Aire Carico",
    description:
      "Más allá de las mascarillas, la verdadera protección está en el aire que respiras en casa. Nuestro filtro de aire de grado médico elimina el 99.9% de virus, bacterias, alérgenos y químicos nocivos que están en el aire.",
    ctas: [
      {
        text: "Respira aire limpio",
        link: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20los%20purificadores%20de%20aire,%20soy:%20%20",
      },
    ],
  },
  {
    videoUrl:
      "https://res.cloudinary.com/dro8ckpco/video/upload/v1757608460/%EF%B8%8FEn_Carico_creemos_que_tu_brillo_empieza_desde_adentro.Con_el_Extractor_de_Jugos_Carico_prepara_f6gg0o.mp4",
    title: "El Juicer Carico",
    description:
      "Tu brillo empieza desde adentro. Con nuestro extractor de jugos verdes fortalece tu sistema inmunológico mejorando como te ves y como te sientes.",
    ctas: [
      {
        text: "Descubre el Juicer",
        link: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20el%20juicer,%20soy:%20%20",
      },
    ],
  },
];

// --- HELPER FUNCTIONS ---
const shuffleArray = (array: VideoItem[]) => {
  let currentIndex = array.length,
    randomIndex;
  const newArray = [...array];
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [
      newArray[randomIndex],
      newArray[currentIndex],
    ];
  }
  return newArray;
};

// --- MAIN COMPONENT ---
const ProductVideos: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledData, setShuffledData] = useState<VideoItem[]>([]);
  const [isCardAnimating, setIsCardAnimating] = useState(false);
  const [isTextFading, setIsTextFading] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setShuffledData(shuffleArray(videoData));
  }, []);

  const changeSlide = (newIndex: number) => {
    if (newIndex === currentIndex || isCardAnimating) return;

    let direction: "next" | "prev" = newIndex > currentIndex ? "next" : "prev";
    if (currentIndex === shuffledData.length - 1 && newIndex === 0) {
      direction = "next";
    }
    if (currentIndex === 0 && newIndex === shuffledData.length - 1) {
      direction = "prev";
    }

    setIsCardAnimating(true);
    setIsTextFading(true);
    setSlideDirection(direction);
    setIsMuted(true);

    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsTextFading(false);
    }, 250);

    setTimeout(() => {
      setIsCardAnimating(false);
    }, 750);
  };

  const handleNext = () => {
    const newIndex =
      currentIndex === shuffledData.length - 1 ? 0 : currentIndex + 1;
    changeSlide(newIndex);
  };

  const handlePrev = () => {
    const newIndex =
      currentIndex === 0 ? shuffledData.length - 1 : currentIndex - 1;
    changeSlide(newIndex);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const currentVideo = videoRef.current;
      currentVideo.muted = !currentVideo.muted;
      setIsMuted(currentVideo.muted);
    }
  };

  if (shuffledData.length === 0) {
    return null;
  }

  const currentVideo = shuffledData[currentIndex];

  const getCardAnimationClass = () => {
    if (!isCardAnimating) return "opacity-100 translate-x-0 -rotate-2";
    if (slideDirection === "next") {
      return "opacity-0 -translate-x-full -rotate-12";
    } else {
      return "opacity-0 translate-x-full rotate-12";
    }
  };

  return (
    <section className="bg-tertiary py-8 md:py-16 overflow-hidden relative">
      {/* Desktop-only Arrows */}
      <button
        onClick={handlePrev}
        className="hidden md:block absolute left-8 top-1/2 -translate-y-1/2 z-20 text-white/50 hover:text-white transition-colors p-2"
      >
        <FaChevronLeft size={40} />
      </button>
      <button
        onClick={handleNext}
        className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2 z-20 text-white/50 hover:text-white transition-colors p-2"
      >
        <FaChevronRight size={40} />
      </button>

      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-5 md:gap-12">
          <div
            className={`md:w-1/3 text-center md:text-left text-white transition-opacity duration-300 ease-in-out ${
              isTextFading ? "opacity-0" : "opacity-100"
            }`}
          >
            <h2 className="text-2xl md:text-4xl font-bold text-text-inverted mb-4">
              {currentVideo.title}
            </h2>
            <p className="text-base md:text-lg text-text-inverted mb-4">
              {currentVideo.description}
            </p>
            <div className="flex flex-col items-center md:items-start gap-4">
              {currentVideo.ctas.map((cta, index) => (
                <a
                  key={index}
                  href={cta.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-primary text-white font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out hover:brightness-110 hover:scale-105 active:scale-95 transform"
                >
                  {cta.text}
                </a>
              ))}
            </div>
          </div>

          <div className="w-full max-w-60 sm:max-w-sm flex flex-col items-center">
            <div className="relative w-full h-100 md:h-137.5">
              <div
                key={currentIndex}
                className={`absolute inset-0 transition-all duration-500 ease-in-out transform animate-slide-in`}
                style={{
                  animationName: isCardAnimating
                    ? "none"
                    : slideDirection === "next"
                      ? "slideInFromRight"
                      : "slideInFromLeft",
                }}
              >
                <div
                  className={`w-full h-full transition-all duration-500 ease-in-out transform ${getCardAnimationClass()}`}
                >
                  <div className="bg-white p-4 pb-16 shadow-2xl rounded-lg w-full h-full flex flex-col">
                    <div className="w-full bg-black rounded-sm overflow-hidden grow relative">
                      <video
                        ref={videoRef}
                        src={currentVideo.videoUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      >
                        Tu navegador no soporta el elemento de video.
                      </video>
                      <button
                        onClick={toggleMute}
                        className="absolute bottom-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition-colors z-10"
                      >
                        {isMuted ? (
                          <FaVolumeMute size={18} />
                        ) : (
                          <FaVolumeUp size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile-only Navigation */}
            <div className="flex md:hidden items-center justify-center gap-4 mt-4">
              <button
                onClick={handlePrev}
                className="text-white/50 hover:text-white transition-colors"
              >
                <FaChevronLeft size={28} />
              </button>
              <div className="flex items-center gap-2">
                {shuffledData.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => changeSlide(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      currentIndex === index ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={handleNext}
                className="text-white/50 hover:text-white transition-colors"
              >
                <FaChevronRight size={28} />
              </button>
            </div>

            {/* Desktop-only Dots */}
            <div className="hidden md:flex items-center justify-center gap-2 mt-4">
              {shuffledData.map((_, index) => (
                <button
                  key={index}
                  onClick={() => changeSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    currentIndex === index ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>
        {`
          @keyframes slideInFromRight {
            from { transform: translateX(120%) rotate(12deg); opacity: 0; }
            to { transform: translateX(0) rotate(-2deg); opacity: 1; }
          }
          @keyframes slideInFromLeft {
            from { transform: translateX(-120%) rotate(-12deg); opacity: 0; }
            to { transform: translateX(0) rotate(-2deg); opacity: 1; }
          }
          .animate-slide-in {
            animation-duration: 500ms;
            animation-timing-function: ease-in-out;
            animation-fill-mode: forwards;
          }
        `}
      </style>
    </section>
  );
};

export default ProductVideos;

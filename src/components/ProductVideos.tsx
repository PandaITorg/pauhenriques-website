"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaVolumeUp,
  FaVolumeMute,
} from "react-icons/fa";

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

const videoData: VideoItem[] = [
  {
    videoUrl:
      "https://res.cloudinary.com/dro8ckpco/video/upload/v1757608465/Mala_circulaci%C3%B3n_Varices_Piernas_cansadas_Si_tu_sangre_no_circula_bien_no_solo_se_sienten_la_re5rqo.mp4",
    title: "Colchon Earthing Carico",
    description:
      "Conectate con la energia de la tierra mientras duermes. Nuestro sistema de descanso Earthing esta disenado para mejorar tu circulacion, reducir la inflamacion y promover un sueno profundo y reparador.",
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
    title: "Ollas de Acero Quirurgico",
    description:
      "Deja de preocuparte por los toxicos. Nuestras ollas de acero quirurgico 3 - 16 unicas con titanio te permiten cocinar de manera segura, preservando el sabor y los nutrientes de tus alimentos sin liberar quimicos.",
    ctas: [
      {
        text: "Cocina con Acero Quirurgico 3 - 16",
        link: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20%22Acero%20Quirurgico%22,%20soy:%20%20",
      },
    ],
  },
  {
    videoUrl:
      "https://res.cloudinary.com/dro8ckpco/video/upload/v1757608462/Sigues_comprando_botellones_%EF%B8%8F_Caros_pesados_sin_minerales_y_expuestos_al_sol.La_realidad_ghybiy.mp4",
    title: "Purificador de Agua Carico",
    description:
      "El agua es vida, y la tuya debe ser pura. Olvidate de los botellones y disfruta de agua alcalina, libre de quimicos, metales pesados, bacterias y contaminantes, directamente desde tu grifo.",
    ctas: [
      {
        text: "Bebe sin toxicos",
        link: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20el%20purificador%20de%20agua,%20soy:%20%20",
      },
    ],
  },
  {
    videoUrl:
      "https://res.cloudinary.com/dro8ckpco/video/upload/v1757608461/El_moho_es_un_enemigo_silencioso_en_tu_hogar_No_solo_mancha_las_paredes-_sus_esporas_viajan_z6eqbi.mp4",
    title: "Sistema de limpieza y desinfecciones",
    description:
      "Elimina el uso de quimicos de limpieza toxicos y deshazte de tu trapeador. Tenemos el sistema de limpieza mas avanzado y revolucionario que aspira y limpia con vapor a un nuevo nivel.",
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
      "Mas alla de las mascarillas, la verdadera proteccion esta en el aire que respiras en casa. Nuestro filtro de aire de grado medico elimina el 99.9% de virus, bacterias, alergenos y quimicos nocivos que estan en el aire.",
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
      "Tu brillo empieza desde adentro. Con nuestro extractor de jugos verdes fortalece tu sistema inmunologico mejorando como te ves y como te sientes.",
    ctas: [
      {
        text: "Descubre el Juicer",
        link: "https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau%20quiero%20conocer%20m%C3%A1s%20sobre%20el%20juicer,%20soy:%20%20",
      },
    ],
  },
];

const shuffleArray = (array: VideoItem[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const ProductVideos: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledData, setShuffledData] = useState<VideoItem[]>([]);
  const [isTextFading, setIsTextFading] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isAnimating = useRef(false);

  useEffect(() => {
    setShuffledData(shuffleArray(videoData));
  }, []);

  const changeSlide = (newIndex: number) => {
    if (newIndex === currentIndex || isAnimating.current) return;
    isAnimating.current = true;
    setIsTextFading(true);
    setIsMuted(true);

    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsTextFading(false);
    }, 250);

    setTimeout(() => {
      isAnimating.current = false;
    }, 500);
  };

  const handleNext = () => {
    const newIndex = currentIndex === shuffledData.length - 1 ? 0 : currentIndex + 1;
    changeSlide(newIndex);
  };

  const handlePrev = () => {
    const newIndex = currentIndex === 0 ? shuffledData.length - 1 : currentIndex - 1;
    changeSlide(newIndex);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  if (shuffledData.length === 0) return null;

  const currentVideo = shuffledData[currentIndex];

  return (
    <section className="bg-tertiary py-10 md:py-16 overflow-hidden relative">
      {/* Desktop arrows */}
      <button
        onClick={handlePrev}
        aria-label="Video anterior"
        className="hidden lg:flex absolute left-4 xl:left-8 top-1/2 -translate-y-1/2 z-20 text-white/40 hover:text-white transition-colors p-3"
      >
        <FaChevronLeft size={36} />
      </button>
      <button
        onClick={handleNext}
        aria-label="Video siguiente"
        className="hidden lg:flex absolute right-4 xl:right-8 top-1/2 -translate-y-1/2 z-20 text-white/40 hover:text-white transition-colors p-3"
      >
        <FaChevronRight size={36} />
      </button>

      <div className="container mx-auto px-5">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
          {/* Video card - shown first on mobile for visual impact */}
          <div className="w-full max-w-xs sm:max-w-sm md:order-2 flex flex-col items-center">
            <div className="relative w-full aspect-9/16 max-h-[70vh] md:max-h-none">
              <div
                key={currentIndex}
                className="absolute inset-0 transition-opacity duration-300"
              >
                <div className="bg-white p-3 pb-12 sm:p-4 sm:pb-14 shadow-2xl rounded-lg w-full h-full flex flex-col -rotate-2">
                  <div className="w-full bg-black rounded-sm overflow-hidden grow relative">
                    <video
                      ref={videoRef}
                      src={currentVideo.videoUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={toggleMute}
                      aria-label={isMuted ? "Activar sonido" : "Silenciar"}
                      className="absolute bottom-2 right-2 bg-black/50 text-white p-2.5 rounded-full hover:bg-black/75 transition-colors z-10"
                    >
                      {isMuted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation dots + arrows (mobile) */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={handlePrev}
                aria-label="Video anterior"
                className="lg:hidden text-white/50 active:text-white transition-colors p-2"
              >
                <FaChevronLeft size={24} />
              </button>
              <div className="flex items-center gap-2">
                {shuffledData.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => changeSlide(index)}
                    aria-label={`Ir al video ${index + 1}`}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      currentIndex === index ? "bg-white scale-125" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={handleNext}
                aria-label="Video siguiente"
                className="lg:hidden text-white/50 active:text-white transition-colors p-2"
              >
                <FaChevronRight size={24} />
              </button>
            </div>
          </div>

          {/* Text content */}
          <div
            className={`md:w-2/5 md:order-1 text-center md:text-left transition-opacity duration-300 ease-in-out ${
              isTextFading ? "opacity-0" : "opacity-100"
            }`}
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-inverted mb-3">
              {currentVideo.title}
            </h2>
            <p className="text-base md:text-lg text-text-inverted/80 mb-5 leading-relaxed">
              {currentVideo.description}
            </p>
            <div className="flex flex-col sm:flex-row items-center md:items-start gap-3">
              {currentVideo.ctas.map((cta, index) => (
                <a
                  key={index}
                  href={cta.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-primary text-white font-bold py-3 px-8 rounded-full text-center transition-all duration-300 ease-in-out hover:brightness-110 hover:scale-105 active:scale-95"
                >
                  {cta.text}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductVideos;

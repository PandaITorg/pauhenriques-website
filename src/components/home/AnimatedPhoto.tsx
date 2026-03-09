"use client";

import { useInView } from "react-intersection-observer";
import Image, { StaticImageData } from "next/image";

interface AnimatedPhotoProps {
  src: string | StaticImageData;
  alt: string;
  className?: string;
}

const AnimatedPhoto = ({ src, alt, className = "" }: AnimatedPhotoProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
    >
      <div className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-lg hover:shadow-[--shadow-glow-primary] transition-shadow duration-500">
        <Image src={src} alt={alt} className="w-full h-auto" />
      </div>
    </div>
  );
};

export default AnimatedPhoto;

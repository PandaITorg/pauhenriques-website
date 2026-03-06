"use client";

import { useInView } from "react-intersection-observer";
import branch from "@/assets/branch.svg";
import Image, { StaticImageData } from "next/image";

interface AnimatedPolaroidProps {
  src: string | StaticImageData;
  alt: string;
  rotation: string;
}

const AnimatedPolaroid = ({ src, alt, rotation }: AnimatedPolaroidProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  return (
    <div
      ref={ref}
      className={`relative w-56 sm:w-64 md:w-72 mx-auto ${inView ? "fall-in" : "opacity-0"}`}
    >
      <Image
        src={branch}
        alt=""
        aria-hidden="true"
        className="absolute -top-10 -left-10 w-24 h-24 transform -rotate-45"
      />
      <div className={`polaroid ${rotation}`}>
        <Image src={src} alt={alt} className="w-full h-auto" />
      </div>
    </div>
  );
};

export default AnimatedPolaroid;

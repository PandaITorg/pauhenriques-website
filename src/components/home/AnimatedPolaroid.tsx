import { useInView } from "react-intersection-observer";
import branch from "../../assets/branch.svg";

interface AnimatedPolaroidProps {
  src: string;
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
      className={`relative w-64 mx-auto ${inView ? "fall-in" : "opacity-0"}`}
    >
      <img
        src={branch}
        alt="branch"
        className="absolute -top-10 -left-10 w-24 h-24 transform -rotate-45"
      />
      <div className={`polaroid ${rotation}`}>
        <img src={src} alt={alt} className="w-full h-auto" />
      </div>
    </div>
  );
};

export default AnimatedPolaroid;

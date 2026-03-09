import Image from "next/image";
import logo from "@/assets/pauhenriques-lightest-green.png";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-bosque-profundo-800">
      <div className="animate-[fadeInPulse_2s_ease-in-out_infinite]">
        <Image
          src={logo}
          alt="Cargando Pau Henriques..."
          width={180}
          height={60}
          className="w-44 h-auto"
          priority
        />
      </div>
      <div className="mt-6 h-px w-16 bg-linear-to-r from-transparent via-primary/40 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
    </div>
  );
}

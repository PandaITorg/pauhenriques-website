import Image from "next/image";
import logo from "@/assets/logo-pauheniriques.svg";

export default function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#143109' }}>
      <Image
        src={logo}
        alt="Cargando Pau Henríques..."
        width={200}
        height={200}
        style={{ width: '200px', height: 'auto' }}
        priority
      />
    </div>
  );
}

import PandaITLogo from "@/assets/PandaIT-imagotipo-horizontal.svg";
import Image from "next/image";

const BottomBar = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="mt-10 md:mt-14 pt-6 border-t border-border-subtle/50 flex flex-col sm:flex-row justify-between items-center text-[11px] text-text-main/30 gap-3">
      <p>&copy; {currentYear} Pau Henriques. Todos los derechos reservados.</p>
      <div className="flex items-center gap-2">
        <span>Desarrollado por</span>
        <a
          href="https://pandait.tech"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-70 transition-opacity duration-300"
        >
          <Image
            src={PandaITLogo}
            alt="Panda IT Logo"
            height={20}
            className="h-5 w-auto opacity-40 hover:opacity-60 transition-opacity duration-300"
          />
        </a>
      </div>
    </div>
  );
};

export default BottomBar;

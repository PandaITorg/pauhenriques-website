import PandaITLogo from "../../assets/PandaIT-imagotipo-horizontal.svg";

const BottomBar = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="mt-12 pt-8 border-t border-color-input-bg flex flex-col sm:flex-row justify-between items-center text-sm text-text-secondary">
      <p className="mb-4 sm:mb-0">
        &copy; {currentYear} Pau Henriques. Todos los derechos reservados.
      </p>
      <div className="flex items-center">
        <span className="mr-2">Desarrollado por</span>
        <a
          href="https://pandait.tech"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
        >
          <img src={PandaITLogo} alt="Panda IT Logo" className="h-6" />
        </a>
      </div>
    </div>
  );
};

export default BottomBar;

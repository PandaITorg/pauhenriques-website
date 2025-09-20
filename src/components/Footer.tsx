import Logo from "./footer/Logo";
import Nav from "./footer/Nav";
import Legal from "./footer/Legal";
import Social from "./footer/Social";
import BottomBar from "./footer/BottomBar";

// Este componente representa el pie de página principal de la aplicación.
const Footer = () => {
  return (
    <footer className="bg-background text-text-main">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <Logo />
          <Nav />
          <Legal />
          <Social />
        </div>
        <BottomBar />
      </div>
    </footer>
  );
};

export default Footer;
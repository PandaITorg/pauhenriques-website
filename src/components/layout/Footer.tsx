import Logo from "@/components/layout/footer/Logo";
import Nav from "@/components/layout/footer/Nav";
import Legal from "@/components/layout/footer/Legal";
import Social from "@/components/layout/footer/Social";
import BottomBar from "@/components/layout/footer/BottomBar";

// Este componente representa el pie de página principal de la aplicación.
const Footer = () => {
  return (
    <footer className="bg-background text-text-main border-t border-border-subtle">
      <div className="max-w-7xl mx-auto py-10 md:py-12 px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8">
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
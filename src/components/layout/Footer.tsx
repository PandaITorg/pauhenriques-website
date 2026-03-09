import Logo from "@/components/layout/footer/Logo";
import Nav from "@/components/layout/footer/Nav";
import Legal from "@/components/layout/footer/Legal";
import Social from "@/components/layout/footer/Social";
import BottomBar from "@/components/layout/footer/BottomBar";

const Footer = () => {
  return (
    <footer className="relative bg-bosque-profundo-800 text-text-main overflow-hidden">
      {/* Top gold accent line */}
      <div className="h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />

      <div className="relative max-w-7xl mx-auto pt-12 pb-8 md:pt-16 md:pb-10 px-5 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* Logo + tagline — full width mobile, 4 cols desktop */}
          <Logo />

          {/* Nav links */}
          <Nav />

          {/* Legal links */}
          <Legal />

          {/* Social */}
          <Social />
        </div>

        <BottomBar />
      </div>
    </footer>
  );
};

export default Footer;

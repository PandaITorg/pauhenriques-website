import sobreMiPauForrest from "../../assets/sobremi-Pau-Forrest.webp";
import sobreMiJorgeYPau from "../../assets/sobre-mi-Jorge-y-Pau.webp";
import AnimatedPolaroid from "./AnimatedPolaroid";
import MistDivider from "./MistDivider";

const SobreMi = () => {
  return (
    <section id="sobre-mi" className="bg-background py-20 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-text-main mb-12 text-center">
            Sobre Mí
          </h2>

          <div className="space-y-12">
            <p className="text-lg text-text-secondary leading-relaxed">
              Hace 15 años me diagnosticaron Psoriasis en la piel, una
              condición “incurable” y en ese momento empezó mi interés por
              entender temas que van más allá de un diagnóstico.
            </p>

            <AnimatedPolaroid
              src={sobreMiPauForrest}
              alt="Pau en el bosque"
              rotation="-rotate-3"
            />

            <p className="text-lg text-text-secondary leading-relaxed">
              Tuve un gran despertar y una curiosidad incansable en aprender
              cómo poder sanar mi cuerpo de adentro para afuera. En como vivir
              un estilo de vida libre de tóxicos.
            </p>

            <p className="text-lg text-text-secondary leading-relaxed">
              Actualmente trabajo junto a mi compañero de vida y esposo Jorge,
              liderando la Marca Carico en el Ecuador. Nos enfocamos en brindar
              una mejor salud y estilo de vida a todos nuestros clientes.
            </p>

            <AnimatedPolaroid
              src={sobreMiJorgeYPau}
              alt="Jorge y Pau"
              rotation="rotate-2"
            />

            <p className="text-lg text-text-secondary leading-relaxed">
              Nuestra filosofía y nuestros productos han mejorado la salud y el
              estilo de vida que tenemos junto con el de cientos de clientes con
              testimonios de vida impactantes.
            </p>
          </div>
        </div>
      </div>
      <MistDivider />
    </section>
  );
};

export default SobreMi;

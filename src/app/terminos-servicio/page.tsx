import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de Servicio | Pau Henriques",
  description: "Consulta los términos y condiciones que rigen el uso de nuestro sitio web y la compra de nuestros productos. Lee nuestros términos de servicio para más información.",
  alternates: {
    canonical: "https://www.pauhenriques.com/terminos-servicio",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function TerminosServicio() {
  return (
    <div className="bg-background text-text-main py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-primary mb-6">
          Términos de Servicio
        </h1>
        <p className="text-sm text-text-secondary mb-8">
          Última actualización: 11 de septiembre de 2024
        </p>

        <div className="space-y-8 text-text-secondary">
          <section>
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              1. Aceptación de los Términos
            </h2>
            <p>
              Al acceder y utilizar el sitio web de Pau Henriques (gestionado
              por María Paula Henriques), aceptas cumplir con estos Términos de
              Servicio y todas las leyes y regulaciones aplicables. Si no estás
              de acuerdo, no debes utilizar este sitio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              2. Uso del Sitio
            </h2>
            <p className="mb-4">
              Este sitio web es para tu uso personal y no comercial. No puedes
              modificar, copiar, distribuir, transmitir, mostrar, realizar,
              reproducir, publicar, licenciar, crear trabajos derivados,
              transferir o vender cualquier información, software, productos o
              servicios obtenidos de este sitio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              3. Productos y Servicios
            </h2>
            <p className="mb-4">
              Nuestro e-commerce opera a través de la plataforma Shopify. Todos
              los productos, precios y promociones están sujetos a cambios sin
              previo aviso. Nos esforzamos por mostrar la información más
              precisa posible, pero no garantizamos que las descripciones de los
              productos u otro contenido sean exactos, completos o libres de
              errores.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              4. Cuentas de Usuario
            </h2>
            <p>
              Para realizar compras, es posible que necesites crear una cuenta.
              Eres responsable de mantener la confidencialidad de tu cuenta y
              contraseña y de restringir el acceso a tu computadora. Aceptas la
              responsabilidad de todas las actividades que ocurran bajo tu cha
              cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              5. Propiedad Intelectual
            </h2>
            <p>
              Todo el contenido de este sitio, incluyendo textos, gráficos,
              logos, iconos y software, es propiedad de María Paula Henriques o
              sus proveedores de contenido y está protegido por las leyes de
              derechos de autor.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              6. Limitación de Responsabilidad
            </h2>
            <p>
              En ningún caso María Paula Henriques será responsable por daños
              directos, indirectos, incidentales, especiales o consecuentes que
              resulten del uso o la imposibilidad de usar este sitio o los
              productos comprados en él.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              7. Ley Aplicable
            </h2>
            <p>
              Estos términos se regirán e interpretarán de acuerdo con las leyes
              de Ecuador, sin dar efecto a ningún principio de conflicto de
              leyes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              8. Cambios a los Términos
            </h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier
              momento. Tu uso continuado del sitio después de cualquier cambio
              constituirá tu aceptación de dichos cambios.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              9. Contacto
            </h2>
            <p>
              Si tienes alguna pregunta sobre estos Términos de Servicio, puedes
              contactarnos a través de nuestro formulario de contacto o
              directamente a [correo electrónico de contacto].
            </p>
          </section>
        </div>
        <p className="mt-8 text-xs text-text-secondary">
          <strong>Nota:</strong> Este es un documento modelo. Te recomiendo
          consultar con un profesional legal para asegurarte de que cumple con
          todas las regulaciones aplicables en tu jurisdicción.
        </p>
      </div>
    </div>
  );
}

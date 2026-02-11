import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | Pau Henriques",
  description: "Conoce cómo manejamos tu información personal y protegemos tu privacidad en nuestro sitio web. Consulta nuestra política de privacidad para más detalles.",
  alternates: {
    canonical: "https://www.pauhenriques.com/politica-privacidad",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function PoliticaPrivacidad() {
  return (
    <div className="bg-background text-text-main py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-primary mb-6">
          Política de Privacidad
        </h1>
        <p className="text-sm text-text-secondary mb-8">
          Última actualización: 11 de septiembre de 2024
        </p>

        <div className="space-y-8 text-text-secondary">
          <section>
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              1. Introducción
            </h2>
            <p>
              Bienvenido a Pau Henriques. Tu privacidad es de suma importancia
              para nosotros. Esta Política de Privacidad describe cómo María
              Paula Henriques ("nosotros", "nuestro") recopila, usa, comparte y
              protege tu información personal cuando visitas nuestro sitio web y
              utilizas nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              2. Información que Recopilamos
            </h2>
            <p className="mb-4">
              Recopilamos varios tipos de información para proporcionar y
              mejorar nuestro servicio:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Información de Identificación Personal:</strong> Nombre,
                apellido, dirección de correo electrónico, dirección de envío,
                número de teléfono, etc., que proporcionas al realizar una
                compra o registrarte.
              </li>
              <li>
                <strong>Información de Pago:</strong> Los datos de tus tarjetas
                de crédito/débito son procesados directamente por pasarelas de
                pago seguras (como Stripe). No almacenamos esta
                información en nuestros servidores.
              </li>
              <li>
                <strong>Información del Dispositivo y Uso:</strong> A través de
                herramientas como Google Analytics, recopilamos información
                sobre tu dispositivo y cómo interactúas con nuestro sitio web
                (dirección IP, tipo de navegador, páginas visitadas, tiempo de
                visita).
              </li>
              <li>
                <strong>Cookies y Tecnologías Similares:</strong> Utilizamos
                cookies para mejorar tu experiencia de navegación, recordar tus
                preferencias y analizar el tráfico del sitio.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              3. Cómo Usamos Tu Información
            </h2>
            <p className="mb-4">
              Utilizamos la información recopilada para los siguientes fines:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Procesar y gestionar tus pedidos, envíos y devoluciones.</li>
              <li>Comunicarnos contigo sobre tu cuenta o tus transacciones.</li>
              <li>
                Proporcionar soporte al cliente y responder a tus consultas.
              </li>
              <li>
                Personalizar y mejorar tu experiencia en nuestro sitio web.
              </li>
              <li>
                Para fines de marketing y promoción, siempre que tengamos tu
                consentimiento.
              </li>
              <li>
                Analizar el rendimiento del sitio y el comportamiento del
                usuario a través de Google Analytics para optimizar nuestros
                servicios.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              4. Con Quién Compartimos Tu Información
            </h2>
            <p className="mb-4">
              No vendemos tu información personal. Podemos compartirla con
              terceros solo en las siguientes circunstancias:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Proveedores de Servicios:</strong> Empresas que nos
                ayudan con el procesamiento de pagos (como Stripe), envíos,
                alojamiento de base de datos y servidor (Firebase), y
                análisis de datos (como Google Analytics).
              </li>
              <li>
                <strong>Cumplimiento Legal:</strong> Si es requerido por ley o
                para proteger nuestros derechos y seguridad o los de otros.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              5. Tus Derechos
            </h2>
            <p>
              Tienes derecho a acceder, corregir, actualizar o solicitar la
              eliminación de tu información personal. También puedes oponerte al
              procesamiento de tus datos o solicitar la portabilidad de los
              mismos. Para ejercer estos derechos, contáctanos a través de la
              información proporcionada al final de esta política.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              6. Cambios a esta Política
            </h2>
            <p>
              Nos reservamos el derecho de modificar esta política de privacidad
              en cualquier momento. Los cambios y aclaraciones entrarán en vigor
              inmediatamente después de su publicación en el sitio web.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-main mb-4">
              7. Contacto
            </h2>
            <p>
              Si tienes alguna pregunta sobre esta Política de Privacidad,
              puedes contactarnos a través de nuestro formulario de contacto o
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
      {/* clean */}
    </div>
  );
}

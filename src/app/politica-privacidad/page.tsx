import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica de Privacidad | Pau Henriques",
  description:
    "Conoce como Maria Paula Henriques Moss recopila, utiliza y protege tu informacion personal en www.pauhenriques.com.",
  alternates: {
    canonical: "https://www.pauhenriques.com/politica-privacidad",
  },
  robots: {
    index: false,
    follow: true,
  },
};

const LI = "relative before:absolute before:-left-3.5 before:top-2.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary/30";

export default function PoliticaPrivacidad() {
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 py-14 md:py-20">
        {/* Header */}
        <header className="mb-12 md:mb-16">
          <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/60 mb-3">
            Legal
          </span>
          <h1 className="font-cormorant text-3xl sm:text-4xl md:text-5xl font-semibold text-text-main mb-3">
            Politica de Privacidad
          </h1>
          <p className="text-sm text-text-main/35">
            Ultima actualizacion: 19 de enero de 2026
          </p>
        </header>

        {/* Content */}
        <div className="space-y-10 text-text-main/60 leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              1. Introduccion
            </h2>
            <p>
              Bienvenido a www.pauhenriques.com. Su privacidad es fundamental para
              nosotros. Esta Politica de Privacidad describe como <strong className="text-text-main/80">Maria
              Paula Henriques Moss</strong> (&ldquo;nosotros&rdquo;,
              &ldquo;nuestro&rdquo;) recopila, utiliza, comparte y protege su
              informacion personal cuando visita nuestro sitio web, crea una cuenta
              o realiza compras a traves de nuestra plataforma. Esta politica se rige
              por la normativa vigente en la Republica del Ecuador.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              2. Informacion que Recopilamos
            </h2>
            <p className="mb-4">
              Recopilamos los siguientes tipos de informacion:
            </p>

            <h3 className="text-sm font-medium text-text-main/70 mb-2 mt-6">
              2.1 Informacion proporcionada al registrarse
            </h3>
            <ul className="space-y-3 pl-5">
              <li className={LI}>
                Nombre y apellido
              </li>
              <li className={LI}>
                Direccion de correo electronico
              </li>
              <li className={LI}>
                Numero de telefono (opcional)
              </li>
              <li className={LI}>
                Contraseña (almacenada de forma cifrada por Firebase Authentication)
              </li>
            </ul>
            <p className="mt-3 text-sm">
              Si utiliza Google Sign-In, recibimos su nombre y correo electronico
              directamente de Google. No accedemos a su contraseña de Google.
            </p>

            <h3 className="text-sm font-medium text-text-main/70 mb-2 mt-6">
              2.2 Informacion de envio
            </h3>
            <ul className="space-y-3 pl-5">
              <li className={LI}>
                Nombre completo del destinatario, direccion, ciudad, provincia,
                codigo postal, pais y telefono de contacto.
              </li>
              <li className={LI}>
                Puede guardar multiples direcciones en su cuenta para futuras compras.
              </li>
            </ul>

            <h3 className="text-sm font-medium text-text-main/70 mb-2 mt-6">
              2.3 Informacion de pago
            </h3>
            <ul className="space-y-3 pl-5">
              <li className={LI}>
                Los datos de su tarjeta de credito o debito son procesados y
                tokenizados directamente por <strong className="text-text-main/80">Nuvei</strong> (proveedor
                certificado PCI-DSS Nivel 1) en su navegador.
              </li>
              <li className={LI}>
                El numero completo de tarjeta (PAN), fecha de vencimiento y codigo
                de seguridad (CVV) <strong className="text-text-main/80">nunca son enviados
                ni almacenados en nuestros servidores</strong>.
              </li>
              <li className={LI}>
                Unicamente recibimos un token de referencia, los ultimos 4 digitos
                y el tipo de tarjeta (Visa, Mastercard o American Express) para
                mostrar en su historial de pagos.
              </li>
            </ul>

            <h3 className="text-sm font-medium text-text-main/70 mb-2 mt-6">
              2.4 Informacion de pedidos
            </h3>
            <ul className="space-y-3 pl-5">
              <li className={LI}>
                Detalle de productos adquiridos, cantidades, montos, estado del
                pedido e identificador de transaccion de Nuvei.
              </li>
            </ul>

            <h3 className="text-sm font-medium text-text-main/70 mb-2 mt-6">
              2.5 Cookies y sesion
            </h3>
            <ul className="space-y-3 pl-5">
              <li className={LI}>
                Utilizamos una unica cookie de sesion (<strong className="text-text-main/80">__session</strong>)
                de tipo HTTP-only y Secure para mantener su sesion autenticada.
                Esta cookie expira a los 5 dias y no se utiliza con fines de
                rastreo ni publicidad.
              </li>
              <li className={LI}>
                No utilizamos cookies de terceros, pixeles de seguimiento, Google
                Analytics ni ninguna otra herramienta de rastreo publicitario.
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              3. Como Utilizamos su Informacion
            </h2>
            <p className="mb-4">
              Utilizamos la informacion recopilada exclusivamente para:
            </p>
            <ul className="space-y-3 pl-5">
              <li className={LI}>
                Crear y gestionar su cuenta de usuario.
              </li>
              <li className={LI}>
                Procesar y gestionar sus pedidos, pagos y envios.
              </li>
              <li className={LI}>
                Comunicarnos con usted sobre el estado de sus transacciones.
              </li>
              <li className={LI}>
                Proporcionar soporte al cliente y responder a sus consultas.
              </li>
              <li className={LI}>
                Verificar su identidad para proteger la seguridad de su cuenta.
              </li>
              <li className={LI}>
                Cumplir con obligaciones legales y regulatorias aplicables.
              </li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              4. Con Quien Compartimos su Informacion
            </h2>
            <p className="mb-4">
              No vendemos, alquilamos ni comercializamos su informacion personal.
              Compartimos datos unicamente con los siguientes proveedores de servicio
              que son estrictamente necesarios para operar la plataforma:
            </p>
            <ul className="space-y-3 pl-5">
              <li className={LI}>
                <strong className="text-text-main/80">Firebase (Google Cloud):</strong> Autenticacion
                de usuarios y almacenamiento seguro de datos en Cloud Firestore.
                Los datos se cifran en reposo y en transito.
              </li>
              <li className={LI}>
                <strong className="text-text-main/80">Nuvei (Paymentez):</strong> Tokenizacion
                y procesamiento de pagos con tarjeta. Reciben su identificador de
                usuario, correo electronico y el token de tarjeta para ejecutar
                las transacciones.
              </li>
              <li className={LI}>
                <strong className="text-text-main/80">Servientrega:</strong> Operador
                logistico que recibe su direccion de envio y datos de contacto
                para realizar la entrega del pedido.
              </li>
              <li className={LI}>
                <strong className="text-text-main/80">Cumplimiento Legal:</strong> Podemos
                divulgar informacion si es requerido por ley, orden judicial o para
                proteger nuestros derechos, seguridad o los de terceros.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              5. Almacenamiento y Seguridad de los Datos
            </h2>
            <ul className="space-y-3 pl-5">
              <li className={LI}>
                Sus datos se almacenan en servidores de Google Cloud (Firebase)
                con cifrado en reposo y en transito.
              </li>
              <li className={LI}>
                Las sesiones se gestionan mediante cookies HTTP-only con flag Secure
                y politica SameSite=Lax para prevenir ataques CSRF.
              </li>
              <li className={LI}>
                Las contraseñas se almacenan cifradas a traves de Firebase
                Authentication y nunca son accesibles en texto plano.
              </li>
              <li className={LI}>
                El acceso a datos en Firestore esta protegido por reglas de
                seguridad que limitan la lectura y escritura al usuario propietario
                de cada documento.
              </li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              6. Sus Derechos
            </h2>
            <p className="mb-4">
              De acuerdo con la normativa vigente, usted tiene derecho a:
            </p>
            <ul className="space-y-3 pl-5">
              <li className={LI}>
                <strong className="text-text-main/80">Acceso:</strong> Consultar la
                informacion personal que tenemos sobre usted a traves de la seccion
                &ldquo;Mi cuenta&rdquo;.
              </li>
              <li className={LI}>
                <strong className="text-text-main/80">Rectificacion:</strong> Corregir o
                actualizar su informacion personal desde su cuenta.
              </li>
              <li className={LI}>
                <strong className="text-text-main/80">Eliminacion:</strong> Solicitar la
                eliminacion de sus datos de direcciones guardadas y tarjetas
                tokenizadas desde la seccion &ldquo;Mi cuenta&rdquo;. Para solicitar
                la eliminacion completa de su cuenta, contactenos directamente.
              </li>
              <li className={LI}>
                <strong className="text-text-main/80">Oposicion:</strong> Oponerse al
                procesamiento de sus datos para fines distintos a los descritos en
                esta politica.
              </li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              7. Retencion de Datos
            </h2>
            <p>
              Conservamos su informacion personal mientras su cuenta permanezca
              activa y durante el periodo necesario para cumplir con los fines
              descritos en esta politica, incluyendo obligaciones legales, contables
              o de informacion. El historial de pedidos se conserva como registro
              contable. Puede solicitar la eliminacion de su cuenta en cualquier
              momento contactandonos a traves de los canales indicados.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              8. Menores de Edad
            </h2>
            <p>
              Este sitio web no esta dirigido a menores de 18 años. No recopilamos
              intencionalmente informacion personal de menores. Si tenemos
              conocimiento de que hemos recopilado datos de un menor sin el
              consentimiento de su representante legal, tomaremos las medidas
              necesarias para eliminar dicha informacion.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              9. Cambios a esta Politica
            </h2>
            <p>
              Nos reservamos el derecho de modificar esta Politica de Privacidad en
              cualquier momento. Los cambios entraran en vigor inmediatamente despues
              de su publicacion en el sitio web. La fecha de &ldquo;ultima
              actualizacion&rdquo; al inicio de este documento refleja la revision
              mas reciente. Se recomienda revisar esta seccion periodicamente.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              10. Legislacion Aplicable
            </h2>
            <p>
              Esta Politica de Privacidad se rige por las leyes de la Republica del
              Ecuador. Cualquier controversia sera resuelta ante las autoridades
              competentes en territorio ecuatoriano.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              11. Contacto
            </h2>
            <p>
              Si tiene alguna pregunta sobre esta Politica de Privacidad o desea
              ejercer sus derechos sobre sus datos personales, puede contactarnos a
              traves de nuestro WhatsApp al{" "}
              <a
                href="https://wa.me/593991712532"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-hover transition-colors underline underline-offset-2"
              >
                +593 99 171 2532
              </a>{" "}
              o a traves de nuestras redes sociales oficiales.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

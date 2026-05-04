import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terminos y Condiciones de Uso y Venta | Pau Henriques",
  description:
    "Terminos y condiciones que rigen el uso del sitio web de Pau Henriques y la compra de productos premium de salud.",
  alternates: {
    canonical: "https://www.pauhenriques.com/terminos-servicio",
  },
  robots: {
    index: false,
    follow: true,
  },
};

const LI = "relative before:absolute before:-left-3.5 before:top-2.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary/30";

export default function TerminosServicio() {
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 py-14 md:py-20">
        {/* Header */}
        <header className="mb-12 md:mb-16">
          <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/60 mb-3">
            Legal
          </span>
          <h1 className="font-cormorant text-3xl sm:text-4xl md:text-5xl font-semibold text-text-main mb-3">
            Terminos y Condiciones de Uso y Venta
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
              1. Aceptacion de los Terminos
            </h2>
            <p>
              Al acceder y utilizar este sitio web (www.pauhenriques.com) o adquirir
              los productos premium de salud ofrecidos, usted acepta cumplir y estar
              sujeto a los presentes terminos y condiciones de uso. Estos terminos
              regulan la relacion comercial entre el cliente
              (&ldquo;El Comprador&rdquo;) y <strong className="text-text-main/80">Maria Paula Henriques
              Moss</strong>. Si no esta de acuerdo con alguna parte de estos
              terminos, le rogamos que no utilice nuestros servicios ni realice
              compras a traves de esta plataforma.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              2. Uso del Servicio
            </h2>
            <p className="mb-4">
              Usted se compromete a utilizar el servicio unicamente con fines legales
              y de acuerdo con estos terminos. Queda prohibido:
            </p>
            <ul className="space-y-3 pl-5">
              <li className={LI}>
                Utilizar el servicio de cualquier manera que pueda dañar,
                deshabilitar o sobrecargar los servidores o plataformas de venta.
              </li>
              <li className={LI}>
                Intentar obtener acceso no autorizado a cualquier parte del servicio
                o sistemas relacionados.
              </li>
              <li className={LI}>
                Transmitir cualquier contenido que sea ilegal, ofensivo o que
                infrinja los derechos de terceros.
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              3. Productos y Modalidades de Compra
            </h2>
            <p className="mb-4">
              Nuestro sitio ofrece dos modalidades de productos:
            </p>
            <ul className="space-y-3 pl-5">
              <li className={LI}>
                <strong className="text-text-main/80">Productos de Catalogo (Carico):</strong> Se
                presentan como escaparate digital informativo. No incluyen precios
                ni carrito de compras. La adquisicion se gestiona exclusivamente a
                traves de asesoria personalizada via WhatsApp. Maria Paula Henriques
                Moss actua como asesora independiente de estos productos.
              </li>
              <li className={LI}>
                <strong className="text-text-main/80">Productos de Venta Directa (Well Me):</strong> Disponibles
                para compra directa en el sitio con carrito de compras, proceso de
                checkout y pago seguro a traves de Nuvei. Se requiere registro
                previo para completar la compra.
              </li>
            </ul>
            <p className="mt-4">
              Todos los productos, precios y promociones estan sujetos a cambios sin
              previo aviso. Nos esforzamos por mostrar la informacion mas precisa
              posible, pero no garantizamos que las descripciones de los productos u
              otro contenido sean exactos, completos o libres de errores.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              4. Cuentas de Usuario
            </h2>
            <p>
              Para realizar compras de productos de venta directa, es necesario crear
              una cuenta proporcionando nombre, apellido, correo electronico y,
              opcionalmente, numero de telefono. Usted puede registrarse con correo
              electronico y contraseña o mediante Google Sign-In. El Comprador es
              responsable de mantener la confidencialidad de su cuenta y de
              restringir el acceso a sus dispositivos. Acepta la responsabilidad de
              todas las actividades que ocurran bajo su cuenta.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              5. Procesamiento de Pagos y Seguridad
            </h2>
            <p className="mb-4">
              El procesamiento de pagos para productos de venta directa se realiza a
              traves de <strong className="text-text-main/80">Nuvei</strong> (proveedor
              certificado PCI-DSS Nivel 1):
            </p>
            <ul className="space-y-3 pl-5">
              <li className={LI}>
                Los datos de tarjeta de credito o debito son tokenizados directamente
                por el SDK de Nuvei en su navegador. El numero completo de tarjeta
                (PAN) nunca es enviado ni almacenado en nuestros servidores.
              </li>
              <li className={LI}>
                Aceptamos tarjetas Visa, Mastercard y American Express.
              </li>
              <li className={LI}>
                Usted puede guardar tarjetas tokenizadas en su cuenta para futuras
                compras. Estos tokens son almacenados de forma segura por Nuvei, no
                por nosotros.
              </li>
              <li className={LI}>
                Los montos se procesan en dolares estadounidenses (USD) sin IVA
                adicional.
              </li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              6. Propiedad Intelectual
            </h2>
            <p>
              Todo el contenido incluido en este sitio (textos, graficos, logotipos,
              imagenes de productos y software) es propiedad de Maria Paula Henriques
              Moss o de sus proveedores de contenido y esta protegido por las leyes
              de propiedad intelectual internacionales y nacionales. Queda prohibida
              su reproduccion, distribucion o uso sin autorizacion expresa.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              7. Politica de Entregas y Logistica
            </h2>
            <p className="mb-4">
              El servicio de envio y entrega de los productos se rige bajo las
              siguientes condiciones:
            </p>
            <ul className="space-y-3 pl-5">
              <li className={LI}>
                <strong className="text-text-main/80">Operador Logistico:</strong> El
                servicio de entrega sera realizado exclusivamente a traves de la
                empresa Servientrega.
              </li>
              <li className={LI}>
                <strong className="text-text-main/80">Responsabilidad:</strong> Maria
                Paula Henriques Moss no se hace responsable por retrasos, daños,
                perdidas o cualquier inconveniente derivado de la gestion de
                transporte una vez que el producto ha sido entregado al operador
                logistico. La responsabilidad se limita a la preparacion y despacho
                del producto en condiciones optimas hacia la oficina de Servientrega.
              </li>
              <li className={LI}>
                <strong className="text-text-main/80">Seguimiento:</strong> El cliente
                recibira un numero de guia para que pueda rastrear su pedido
                directamente con el proveedor logistico.
              </li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              8. Devoluciones y Reembolsos
            </h2>
            <ul className="space-y-3 pl-5">
              <li className={LI}>
                <strong className="text-text-main/80">Consentimiento Previo:</strong> El
                Comprador no puede devolver los bienes comprados sin el
                consentimiento previo por escrito de Maria Paula Henriques Moss,
                quien puede otorgarlo o retenerlo a su entera discrecion.
              </li>
              <li className={LI}>
                <strong className="text-text-main/80">Tasa de Reemplazo:</strong> Cualquier
                devolucion autorizada esta sujeta a una tasa de reemplazo de la
                mercancia del veinticinco por ciento (25%). Maria Paula Henriques
                Moss, a su discrecion, podria pero no esta obligada a recibir
                devoluciones no autorizadas del Comprador y a expensas del Comprador.
              </li>
              <li className={LI}>
                <strong className="text-text-main/80">Condicion del Producto:</strong> Si
                se autoriza la devolucion, el Comprador debe devolver los productos
                al cien por ciento (100%) completos, incluyendo todas las cajas y
                materiales de embalaje originales, manuales de usuario, tarjetas de
                registro en blanco, garantias y otros accesorios y documentos
                proporcionados originalmente.
              </li>
              <li className={LI}>
                <strong className="text-text-main/80">Costos y Riesgos:</strong> El
                Comprador es responsable de los cargos de manejo y envio de los
                articulos devueltos. El Comprador acepta el riesgo de cualquier
                perdida o daño ocurrido durante el envio. Se recomienda
                encarecidamente utilizar unicamente compañias de envio que puedan
                proporcionar un comprobante de entrega.
              </li>
              <li className={LI}>
                <strong className="text-text-main/80">Rechazo:</strong> Si el Comprador
                envia productos sin la autorizacion previa, Maria Paula Henriques
                Moss, a su entera discrecion, podria aceptar o rechazar la entrega
                y tomarlo como reemplazo voluntario de bienes o tomar otras medidas
                que considere aceptables.
              </li>
            </ul>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              9. Garantias
            </h2>
            <ul className="space-y-3 pl-5">
              <li className={LI}>
                <strong className="text-text-main/80">Cobertura:</strong> Maria Paula
                Henriques Moss garantiza unicamente que, debido a las variaciones
                permisibles en la industria, los bienes seran de conformidad a las
                especificaciones proporcionadas.
              </li>
              <li className={LI}>
                <strong className="text-text-main/80">Reparacion o Reemplazo:</strong> Si
                los bienes no cumplen con tales especificaciones, Maria Paula
                Henriques Moss, a su discrecion, podra reparar o reemplazar dichos
                bienes.
              </li>
              <li className={LI}>
                <strong className="text-text-main/80">Limitacion:</strong> Maria Paula
                Henriques Moss no otorga otras garantias, representaciones o
                convenios por obra, calidad, condicion o comercializacion para
                cualquier proposito particular de los bienes fuera de lo expresado en
                este documento.
              </li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              10. Privacidad y Datos Personales
            </h2>
            <p>
              Su privacidad es fundamental. El uso de su informacion personal se rige
              por nuestra{" "}
              <a href="/politica-privacidad" className="text-primary hover:text-primary-hover transition-colors underline underline-offset-2">
                Politica de Privacidad
              </a>
              , la cual describe como Maria Paula Henriques Moss recopila, utiliza y
              protege sus datos personales de acuerdo con la normativa vigente en la
              Republica del Ecuador.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              11. Limitacion de Responsabilidad
            </h2>
            <p>
              En la medida permitida por la ley, Maria Paula Henriques Moss no sera
              responsable de ningun daño indirecto, incidental o consecuente que
              resulte del uso de los productos o de la imposibilidad de usar el
              servicio de venta en linea, fuera de las garantias expresas mencionadas
              en la seccion 9 de este documento.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              12. Modificaciones de los Terminos
            </h2>
            <p>
              Maria Paula Henriques Moss se reserva el derecho de modificar estos
              terminos en cualquier momento. Los cambios entraran en vigor
              inmediatamente despues de su publicacion en el sitio web. Se recomienda
              al cliente revisar periodicamente esta seccion antes de realizar una
              compra.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              13. Legislacion Aplicable
            </h2>
            <p>
              Estos terminos se regiran e interpretaran de acuerdo con las leyes de
              la Republica del Ecuador. Cualquier controversia sera resuelta ante las
              autoridades competentes en territorio ecuatoriano.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-lg font-medium text-text-main mb-3">
              14. Contacto
            </h2>
            <p>
              Si tiene alguna pregunta sobre estos Terminos y Condiciones, puede
              contactarnos a traves de nuestro WhatsApp al{" "}
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

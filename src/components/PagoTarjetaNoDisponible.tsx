import { FaWhatsapp } from "react-icons/fa";
import { enlaceWhatsApp } from "@/lib/pago-tarjeta";

/** Lo que se muestra en lugar del pago mientras el cobro con tarjeta está apagado. */
export function PagoTarjetaNoDisponible({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-default bg-surface-card p-6">
      <p className="text-sm text-text-main">
        El pago con tarjeta no está disponible por unos días. Escríbenos por WhatsApp: te
        enviamos el detalle listo y coordinamos contigo el pago.
      </p>
      <a
        href={enlaceWhatsApp(mensaje)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
      >
        <FaWhatsapp className="h-5 w-5" />
        Continuar por WhatsApp
      </a>
    </div>
  );
}

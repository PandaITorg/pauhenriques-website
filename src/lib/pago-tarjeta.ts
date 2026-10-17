/**
 * ¿Se cobra con tarjeta? Interruptor por variable de entorno (apphosting.yaml).
 * El 2026-10-17 Nuvei desactivó la aplicación de servidor PAUHENRIQUES-EC-SERVER:
 * mientras tanto, el checkout, los regalos del plan de novios y los enlaces de pago
 * (talleres) ofrecen terminar por WhatsApp. Para volver a cobrar: poner "true" en
 * NEXT_PUBLIC_PAGO_CON_TARJETA y publicar (se lee al compilar).
 */
export const PAGO_CON_TARJETA = process.env.NEXT_PUBLIC_PAGO_CON_TARJETA !== "false";

export const WHATSAPP_PAU = "593991712532";

export function enlaceWhatsApp(texto: string, numero: string = WHATSAPP_PAU): string {
  return `https://wa.me/${numero.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(texto)}`;
}

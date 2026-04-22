// Curso digital "Tóxica sin Tóxicos" — catálogo de link de pago.
// Precio base $97 CON IVA. Descuentos programados van bajando con el tiempo.

// IVA Ecuador 15%. Subtotal = 97 / 1.15 = 84.3478 → redondeo 84.35.
const BASE_SUBTOTAL = 84.35;

/**
 * Tiers de precio del taller. Todos los finalPrice incluyen IVA (es lo que
 * paga el cliente). Cada tier cierra a las 23:59 hora Ecuador (UTC-5) del
 * día indicado. Después del último tier con fecha, si no hay ninguno
 * permanente, se cobra el precio base ($97).
 *
 * Estos defaults se escriben al producto en Firestore la primera vez que
 * alguien abre /pago/toxica-sin-toxicos. Desde Fase B (admin UI) se van a
 * poder editar desde la web sin tocar este archivo.
 */
export const DEFAULT_COURSE_DISCOUNTS = [
  {
    finalPrice: 55.0,
    label: "Compra anticipada",
    // Sábado 25 de abril 2026, 23:59 Ecuador (UTC-5).
    validUntil: "2026-04-26T04:59:59.999Z",
  },
  {
    finalPrice: 67.0,
    label: "Precio regular",
    // Miércoles 29 de abril 2026, 23:59 Ecuador (UTC-5). Tentativo.
    validUntil: "2026-04-30T04:59:59.999Z",
  },
  {
    finalPrice: 77.0,
    label: "Última semana",
    // Sábado 3 de mayo 2026, 23:59 Ecuador (UTC-5). Tentativo.
    validUntil: "2026-05-04T04:59:59.999Z",
  },
  // Después del 3 de mayo → precio base $97 (sin descuento).
] as const;

export const CURSO_TOXICA_SIN_TOXICOS = {
  productId: "curso-toxica-sin-toxicos",
  name: "Tóxica sin Tóxicos — Taller Online",
  brand: "Pau Henriques",
  shortDescription:
    "Taller en vivo para transformar tu hogar, tu mesa y tu rutina eliminando tóxicos sin complicaciones.",
  longDescription:
    "Un taller en vivo, práctico y paso a paso, para identificar los tóxicos ocultos en tu día a día y reemplazarlos por alternativas limpias, accesibles y sostenibles. Queda grabado para que lo puedas volver a ver luego desde cualquier dispositivo.",
  image: "/assets/de-toxica-a-sin-toxicos.webp",
  category: "Cursos",
  productType: "Infrarrojo" as const,
  // El curso se vende exclusivamente a través del link /pago/toxica-sin-toxicos.
  // No debe aparecer en /tienda ni en ningún listado de catálogo.
  hiddenFromCatalog: true,
  // Precio BASE sin IVA (regular, sin descuento). Con IVA = $97.00.
  priceWithoutVat: BASE_SUBTOTAL,
  postPurchaseNote:
    "Recibirás el acceso al taller por correo en un máximo de 24 horas. Si no lo ves en tu bandeja de entrada, revisá spam o escríbenos por WhatsApp.",
} as const;

export type CourseConfig = typeof CURSO_TOXICA_SIN_TOXICOS;

// Curso digital "Tóxica sin Tóxicos" — catálogo de link de pago.
// Precio fijo al cliente: $55 IVA incluido. Desglose contable: subtotal 47.83 + IVA 7.17.

export const CURSO_TOXICA_SIN_TOXICOS = {
  productId: "curso-toxica-sin-toxicos",
  name: "Tóxica sin Tóxicos — Curso Online",
  brand: "Pau Henriques",
  shortDescription:
    "Curso online para transformar tu hogar, tu mesa y tu rutina eliminando tóxicos sin complicaciones.",
  longDescription:
    "Un programa práctico y paso a paso para identificar los tóxicos ocultos en tu día a día y reemplazarlos por alternativas limpias, accesibles y sostenibles. Acceso de por vida desde cualquier dispositivo.",
  image: "/assets/de-toxica-a-sin-toxicos.webp",
  category: "Cursos",
  productType: "Infrarrojo" as const,
  // El curso se vende exclusivamente a través del link /pago/toxica-sin-toxicos.
  // No debe aparecer en /tienda ni en ningún listado de catálogo.
  hiddenFromCatalog: true,
  // Pricing (IVA Ecuador 15%)
  priceWithoutVat: 47.83,
  vat: 7.17,
  total: 55.0,
  postPurchaseNote:
    "Recibirás el acceso al curso por correo en un máximo de 24 horas. Si no lo ves en tu bandeja de entrada, revisa spam o escríbenos por WhatsApp.",
} as const;

export type CourseConfig = typeof CURSO_TOXICA_SIN_TOXICOS;

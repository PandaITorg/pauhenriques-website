import { z } from "zod";

// Normalize phone: strip spaces, dashes, and convert +593 prefix to 0
function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-().]/g, "");
  if (cleaned.startsWith("+593")) return "0" + cleaned.slice(4);
  return cleaned;
}

export const shippingAddressSchema = z.object({
  fullName: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(100, "Máximo 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, "Solo letras y espacios"),
  phone: z
    .string()
    .transform(normalizePhone)
    .pipe(
      z
        .string()
        .regex(/^0\d{8,9}$/, "Teléfono inválido (ej: 0991234567 o +593991234567)"),
    ),
  address: z
    .string()
    .min(5, "Mínimo 5 caracteres")
    .max(200, "Máximo 200 caracteres"),
  city: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(50, "Máximo 50 caracteres"),
  province: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(50, "Máximo 50 caracteres"),
  postalCode: z
    .string()
    .regex(/^(\d{6})?$/, "Código postal: 6 dígitos")
    .default(""),
  country: z.string().default("Ecuador"),
});

export type ShippingAddressInput = z.input<typeof shippingAddressSchema>;
export type ShippingAddressOutput = z.output<typeof shippingAddressSchema>;

import { z } from "zod";

const PromotionRuleSchema = z.object({
  minPurchaseAmount: z.number().min(0).optional(),
  maxTotalUses: z.number().int().min(0).optional(),
  maxUsesPerUser: z.number().int().min(0).optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  applicableProductIds: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional(),
});

const BasePromotionSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  description: z.string().max(200).optional(),
  code: z
    .string()
    .min(3, "El codigo debe tener al menos 3 caracteres")
    .max(20)
    .transform((v) => v.toUpperCase()),
  type: z.enum(["percentage", "fixed_amount", "free_shipping"]),
  value: z.number().min(0),
  maxDiscountAmount: z.number().min(0).optional(),
  showAsBanner: z.boolean().default(false),
  rules: PromotionRuleSchema,
});

export const CreatePromotionSchema = BasePromotionSchema.refine(
  (data) => {
    if (data.type === "percentage" && (data.value < 0 || data.value > 100)) {
      return false;
    }
    return true;
  },
  { message: "El porcentaje debe estar entre 0 y 100", path: ["value"] },
).refine(
  (data) => {
    return new Date(data.rules.validUntil) > new Date(data.rules.validFrom);
  },
  {
    message: "La fecha fin debe ser posterior a la fecha inicio",
    path: ["rules", "validUntil"],
  },
);

// For updates, use the base object schema with partial (no refinements needed on partial updates)
export const UpdatePromotionSchema = BasePromotionSchema.partial();

export const ValidateCouponSchema = z.object({
  code: z.string().min(1).transform((v) => v.toUpperCase()),
  subtotal: z.number().min(0),
  items: z.array(
    z.object({
      productId: z.string(),
      price: z.number(),
      quantity: z.number().int().min(1),
    }),
  ),
});

export type CreatePromotionInput = z.infer<typeof CreatePromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof UpdatePromotionSchema>;
export type ValidateCouponInput = z.infer<typeof ValidateCouponSchema>;

import { Timestamp } from "firebase/firestore";

export type PromotionType = "percentage" | "fixed_amount" | "free_shipping";

export type PromotionStatus = "active" | "scheduled" | "expired" | "disabled";

export interface PromotionRule {
  minPurchaseAmount?: number;
  maxTotalUses?: number;
  maxUsesPerUser?: number;
  validFrom: Timestamp;
  validUntil: Timestamp;
  applicableProductIds?: string[];
  applicableCategories?: string[];
}

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  code: string;
  type: PromotionType;
  value: number;
  maxDiscountAmount?: number;
  rules: PromotionRule;
  currentUses: number;
  isActive: boolean;
  showAsBanner: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PromotionUsage {
  userId: string;
  orderId: string;
  discountApplied: number;
  usedAt: Timestamp;
}

export function computePromotionStatus(promo: Promotion): PromotionStatus {
  if (!promo.isActive) return "disabled";

  const now = Date.now();
  const from = promo.rules.validFrom.toMillis();
  const until = promo.rules.validUntil.toMillis();

  if (now < from) return "scheduled";
  if (
    now > until ||
    (promo.rules.maxTotalUses && promo.currentUses >= promo.rules.maxTotalUses)
  ) {
    return "expired";
  }

  return "active";
}

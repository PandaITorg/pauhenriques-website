/**
 * Card BIN (Bank Identification Number) lookup types.
 * Source data: Nuvei BIN database (Ecuador), updated periodically by Nuvei rep.
 */

export type CardBrand = "vi" | "mc" | "ax" | "di" | "dc" | "up" | "cs" | "unknown";
export type CardType = "credit" | "debit" | "prepaid" | "unknown";
export type CardCarrier = "datafast" | "medianet" | "both" | "unknown";

export interface BinInfo {
  bank: string;
  brand: CardBrand;
  type: CardType;
  carrier: CardCarrier;
  requiresOtp: boolean;
}

export interface BinDatabase {
  data: Record<string, BinInfo>;
  version: string;
  count: number;
  updatedAt?: string;
}

export const CARD_BRAND_NAMES: Record<CardBrand, string> = {
  vi: "Visa",
  mc: "Mastercard",
  ax: "American Express",
  di: "Diners Club",
  dc: "Discover",
  up: "UnionPay",
  cs: "Credisensa",
  unknown: "Tarjeta",
};

export const CARD_TYPE_NAMES: Record<CardType, string> = {
  credit: "Crédito",
  debit: "Débito",
  prepaid: "Prepago",
  unknown: "",
};

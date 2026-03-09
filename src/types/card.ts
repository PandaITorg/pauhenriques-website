export interface SavedCard {
  bin: string;
  status: "valid" | "review" | "pending" | "rejected";
  token: string;
  holder_name: string;
  expiry_year: string;
  expiry_month: string;
  transaction_reference: string;
  type: string; // "vi" = Visa, "mc" = Mastercard, "ax" = Amex
  number: string; // last 4 digits
}

export function getCardBrandName(type: string): string {
  const brands: Record<string, string> = {
    vi: "Visa",
    mc: "Mastercard",
    ax: "American Express",
    di: "Diners",
    dc: "Discover",
  };
  return brands[type] || type.toUpperCase();
}

/**
 * Bank brand colors for Ecuadorian banks (and a few common LATAM ones).
 * These are approximate brand primary colors — used to give saved cards
 * a more recognizable visual identity, not to replicate the actual physical
 * card design (which varies per product line within a bank).
 *
 * Lookup is by normalized bank name (lowercase, no accents, alphanumeric).
 * Falls back to brand network colors (Visa/MC/Amex/Diners) when no match.
 */

export interface BankPalette {
  /** Primary brand color (hex) */
  primary: string;
  /** Optional secondary for gradients */
  secondary?: string;
}

const BANK_PALETTES: Record<string, BankPalette> = {
  // Ecuador — major banks
  bancopichincha: { primary: "#FFCB05", secondary: "#003875" },
  pichincha: { primary: "#FFCB05", secondary: "#003875" },
  bancodelpacifico: { primary: "#00A39B", secondary: "#005a55" },
  pacifico: { primary: "#00A39B", secondary: "#005a55" },
  bancoguayaquil: { primary: "#0080C4", secondary: "#003366" },
  guayaquil: { primary: "#0080C4", secondary: "#003366" },
  bancobolivarianoca: { primary: "#C8102E", secondary: "#7a0a1e" },
  bolivariano: { primary: "#C8102E", secondary: "#7a0a1e" },
  bancointernacional: { primary: "#003366", secondary: "#001a33" },
  internacional: { primary: "#003366", secondary: "#001a33" },
  bancodelaproduccionsaprodubanco: { primary: "#8DC63F", secondary: "#3e7716" },
  produbanco: { primary: "#8DC63F", secondary: "#3e7716" },
  bancodelaustro: { primary: "#003F87", secondary: "#001f44" },
  austro: { primary: "#003F87", secondary: "#001f44" },
  dinersclubdelecuador: { primary: "#0079BE", secondary: "#004570" },
  diners: { primary: "#0079BE", secondary: "#004570" },
  bancosolidario: { primary: "#0099CC", secondary: "#005f80" },
  solidario: { primary: "#0099CC", secondary: "#005f80" },
  bancoamazonassa: { primary: "#00A651", secondary: "#005d2e" },
  amazonas: { primary: "#00A651", secondary: "#005d2e" },
  bancoprocredit: { primary: "#F36F21", secondary: "#a44a16" },
  procredit: { primary: "#F36F21", secondary: "#a44a16" },
  banecuador: { primary: "#FFCB05", secondary: "#003875" },
  bancodelojasa: { primary: "#1C8A3E", secondary: "#0e4d22" },
  loja: { primary: "#1C8A3E", secondary: "#0e4d22" },
  bancodemachalasa: { primary: "#003F87", secondary: "#001f44" },
  machala: { primary: "#003F87", secondary: "#001f44" },
  bancodellitoral: { primary: "#003366", secondary: "#001a33" },
  litoral: { primary: "#003366", secondary: "#001a33" },
  bancocomercialdemanabisa: { primary: "#0066B3", secondary: "#003c69" },
  bancocodesarrollo: { primary: "#1E8449", secondary: "#0d4621" },
  codesarrollo: { primary: "#1E8449", secondary: "#0d4621" },
  bancoatlantida: { primary: "#0099D8", secondary: "#005a82" },
  atlantida: { primary: "#0099D8", secondary: "#005a82" },
  bancoatlantidadeecuador: { primary: "#0099D8", secondary: "#005a82" },
  bancodelbarrio: { primary: "#0080C4", secondary: "#003366" },
  bancodmiro: { primary: "#003366", secondary: "#001a33" },
  dmiro: { primary: "#003366", secondary: "#001a33" },
  bancocapital: { primary: "#003F87", secondary: "#001f44" },
  bancogeneralrumiñahui: { primary: "#003366", secondary: "#001a33" },
  rumiñahui: { primary: "#003366", secondary: "#001a33" },
  bancorumiñahui: { primary: "#003366", secondary: "#001a33" },
  asociacionmutualistadeahorroycreditoparalaviviendaazuay: { primary: "#003F87", secondary: "#001f44" },
  asociacionmutualistadeahorroycreditoparalaviviendapichincha: { primary: "#FFCB05", secondary: "#003875" },
  mutualistapichincha: { primary: "#FFCB05", secondary: "#003875" },
  mutualistaazuay: { primary: "#003F87", secondary: "#001f44" },
};

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z]/g, "");
}

/**
 * Lookup the palette for a bank. Returns null if no match.
 * Strategy: try the full normalized name first, then progressively
 * shorter prefixes (e.g. "bancopichinchaca" → "bancopichincha" → "pichincha").
 */
export function lookupBankPalette(bankName: string | undefined): BankPalette | null {
  if (!bankName) return null;
  const norm = normalize(bankName);
  if (!norm) return null;

  // Direct hit
  if (BANK_PALETTES[norm]) return BANK_PALETTES[norm];

  // Try matching by token containment (e.g. "bancopichinchaca" contains "pichincha")
  for (const key of Object.keys(BANK_PALETTES)) {
    if (norm.includes(key) && key.length >= 6) {
      return BANK_PALETTES[key];
    }
  }
  return null;
}

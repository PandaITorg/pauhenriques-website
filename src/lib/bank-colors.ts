/**
 * Bank brand colors for Ecuadorian banks and cooperativas.
 * Each bank can have different colors per card type (credit / debit / prepaid).
 *
 * Lookup is by normalized bank name (lowercase, no accents, alphanumeric).
 * Falls back to brand network colors when no match.
 */

import type { CardType } from "@/types/bin";

export interface BankPalette {
  /** Primary brand color (hex) */
  primary: string;
  /** Optional secondary for gradients */
  secondary?: string;
}

type BankByType = Partial<Record<CardType, BankPalette>>;

/**
 * For each bank, color per card type. If a type is missing, falls back
 * to the bank's "credit" color, then "debit", then network brand color.
 */
const BANK_PALETTES: Record<string, BankByType> = {
  // ── Bancos comerciales con 3 variantes ──
  bancopichincha: {
    credit: { primary: "#FFCB05", secondary: "#a87f00" },
    debit: { primary: "#FFCB05", secondary: "#a87f00" },
    prepaid: { primary: "#4A4A4A", secondary: "#1a1a1a" },
  },
  pichincha: {
    credit: { primary: "#FFCB05", secondary: "#a87f00" },
    debit: { primary: "#FFCB05", secondary: "#a87f00" },
    prepaid: { primary: "#4A4A4A", secondary: "#1a1a1a" },
  },
  bancodelpacifico: {
    credit: { primary: "#0A4664", secondary: "#031f30" },
    debit: { primary: "#0082C8", secondary: "#003e63" },
    prepaid: { primary: "#145A50", secondary: "#062b25" },
  },
  pacifico: {
    credit: { primary: "#0A4664", secondary: "#031f30" },
    debit: { primary: "#0082C8", secondary: "#003e63" },
    prepaid: { primary: "#145A50", secondary: "#062b25" },
  },
  bancoguayaquil: {
    credit: { primary: "#201858", secondary: "#0a081f" },
    debit: { primary: "#101040", secondary: "#06061f" },
  },
  guayaquil: {
    credit: { primary: "#201858", secondary: "#0a081f" },
    debit: { primary: "#101040", secondary: "#06061f" },
  },
  bancointernacional: {
    credit: { primary: "#F08820", secondary: "#8a460a" },
    debit: { primary: "#F08820", secondary: "#8a460a" },
    prepaid: { primary: "#F08820", secondary: "#8a460a" },
  },
  internacional: {
    credit: { primary: "#F08820", secondary: "#8a460a" },
    debit: { primary: "#F08820", secondary: "#8a460a" },
    prepaid: { primary: "#F08820", secondary: "#8a460a" },
  },
  bancodelaproduccionsaprodubanco: {
    credit: { primary: "#004828", secondary: "#001f10" },
    debit: { primary: "#004828", secondary: "#001f10" },
    prepaid: { primary: "#D0D028", secondary: "#7a7a14" },
  },
  produbanco: {
    credit: { primary: "#004828", secondary: "#001f10" },
    debit: { primary: "#004828", secondary: "#001f10" },
    prepaid: { primary: "#D0D028", secondary: "#7a7a14" },
  },
  bancobolivarianoca: {
    credit: { primary: "#B8B8B8", secondary: "#5e5e5e" },
    debit: { primary: "#009B8A", secondary: "#004540" },
  },
  bolivariano: {
    credit: { primary: "#B8B8B8", secondary: "#5e5e5e" },
    debit: { primary: "#009B8A", secondary: "#004540" },
  },
  bancodiners: {
    credit: { primary: "#1C1C1C", secondary: "#000000" },
    debit: { primary: "#1C1C1C", secondary: "#000000" },
    prepaid: { primary: "#1C1C1C", secondary: "#000000" },
  },
  diners: {
    credit: { primary: "#1C1C1C", secondary: "#000000" },
    debit: { primary: "#1C1C1C", secondary: "#000000" },
    prepaid: { primary: "#1C1C1C", secondary: "#000000" },
  },
  cooperativadeahorroycreditojuventudecuatorianaprogresistaltdaecuador: {
    credit: { primary: "#2C4A8C", secondary: "#101e3f" },
    debit: { primary: "#1E3A7A", secondary: "#0a1838" },
    prepaid: { primary: "#1E3A7A", secondary: "#0a1838" },
  },
  cooperativajep: {
    credit: { primary: "#2C4A8C", secondary: "#101e3f" },
    debit: { primary: "#1E3A7A", secondary: "#0a1838" },
    prepaid: { primary: "#1E3A7A", secondary: "#0a1838" },
  },
  jep: {
    credit: { primary: "#2C4A8C", secondary: "#101e3f" },
    debit: { primary: "#1E3A7A", secondary: "#0a1838" },
    prepaid: { primary: "#1E3A7A", secondary: "#0a1838" },
  },
  cooperativadeahorroycreditopolicianacional: {
    credit: { primary: "#003087", secondary: "#001138" },
    debit: { primary: "#003087", secondary: "#001138" },
    prepaid: { primary: "#003087", secondary: "#001138" },
  },
  cooperativapolicianacional: {
    credit: { primary: "#003087", secondary: "#001138" },
    debit: { primary: "#003087", secondary: "#001138" },
  },

  // ── Bancos con 2 variantes ──
  bancodelaustro: {
    credit: { primary: "#C0161A", secondary: "#5e0809" },
    debit: { primary: "#C0161A", secondary: "#5e0809" },
  },
  austro: {
    credit: { primary: "#C0161A", secondary: "#5e0809" },
    debit: { primary: "#C0161A", secondary: "#5e0809" },
  },
  bancosolidario: {
    credit: { primary: "#E07820", secondary: "#7a3e0a" },
    debit: { primary: "#78B830", secondary: "#3f6515" },
  },
  solidario: {
    credit: { primary: "#E07820", secondary: "#7a3e0a" },
    debit: { primary: "#78B830", secondary: "#3f6515" },
  },
  bancoamazonassa: {
    credit: { primary: "#1A1A1A", secondary: "#000000" },
    debit: { primary: "#1A1A1A", secondary: "#000000" },
  },
  amazonas: {
    credit: { primary: "#1A1A1A", secondary: "#000000" },
    debit: { primary: "#1A1A1A", secondary: "#000000" },
  },
  bancoprocredit: {
    credit: { primary: "#3A7830", secondary: "#1a3614" },
    debit: { primary: "#3A7830", secondary: "#1a3614" },
  },
  bancoprocreditecuadorsa: {
    credit: { primary: "#3A7830", secondary: "#1a3614" },
    debit: { primary: "#3A7830", secondary: "#1a3614" },
  },
  procredit: {
    credit: { primary: "#3A7830", secondary: "#1a3614" },
    debit: { primary: "#3A7830", secondary: "#1a3614" },
  },
  bancodelojasa: {
    credit: { primary: "#1E1E1E", secondary: "#000000" },
    debit: { primary: "#1E1E1E", secondary: "#000000" },
  },
  loja: {
    credit: { primary: "#1E1E1E", secondary: "#000000" },
    debit: { primary: "#1E1E1E", secondary: "#000000" },
  },
  bancodemachalasa: {
    credit: { primary: "#1B5E38", secondary: "#0a2c1a" },
    debit: { primary: "#1B5E38", secondary: "#0a2c1a" },
  },
  machala: {
    credit: { primary: "#1B5E38", secondary: "#0a2c1a" },
    debit: { primary: "#1B5E38", secondary: "#0a2c1a" },
  },
  bancocomercialdemanabisa: {
    credit: { primary: "#004F9F", secondary: "#001f44" },
    debit: { primary: "#004F9F", secondary: "#001f44" },
  },
  bancogeneralrumiñahuisa: {
    credit: { primary: "#E03020", secondary: "#7a1610" },
    debit: { primary: "#101010", secondary: "#000000" },
  },
  bancogeneralruminahuisa: {
    credit: { primary: "#E03020", secondary: "#7a1610" },
    debit: { primary: "#101010", secondary: "#000000" },
  },
  rumiñahui: {
    credit: { primary: "#E03020", secondary: "#7a1610" },
    debit: { primary: "#101010", secondary: "#000000" },
  },
  ruminahui: {
    credit: { primary: "#E03020", secondary: "#7a1610" },
    debit: { primary: "#101010", secondary: "#000000" },
  },

  // ── Bancos con 1 variante ──
  banecuador: {
    debit: { primary: "#2CC4B0", secondary: "#0e5e54" },
  },
  bancoatlantida: {
    debit: { primary: "#003087", secondary: "#001138" },
  },
  atlantida: {
    debit: { primary: "#003087", secondary: "#001138" },
  },
  bancoatlantidadeecuador: {
    debit: { primary: "#003087", secondary: "#001138" },
  },
  bancodellitoral: {
    debit: { primary: "#0070B8", secondary: "#003056" },
  },
  bancocodesarrollo: {
    debit: { primary: "#006837", secondary: "#002e18" },
  },
  codesarrollo: {
    debit: { primary: "#006837", secondary: "#002e18" },
  },
  bancovisionfund: {
    debit: { primary: "#FF6600", secondary: "#7a2f00" },
  },

  // ── Mutualistas ──
  mutualistapichincha: {
    debit: { primary: "#FFCB05", secondary: "#a87f00" },
  },
  asociacionmutualistadeahorroycreditoparalaviviendapichincha: {
    debit: { primary: "#FFCB05", secondary: "#a87f00" },
  },
  asociacionmutualistadeahorroycreditoparalaviviendaazuay: {
    debit: { primary: "#0057A8", secondary: "#00264a" },
  },
  mutualistaazuay: {
    debit: { primary: "#0057A8", secondary: "#00264a" },
  },

  // ── Cooperativas grandes ──
  cooperativa29deoctubre: {
    credit: { primary: "#B8001C", secondary: "#5e000e" },
    debit: { primary: "#B8001C", secondary: "#5e000e" },
  },
  coop29deoctubre: {
    credit: { primary: "#B8001C", secondary: "#5e000e" },
    debit: { primary: "#B8001C", secondary: "#5e000e" },
  },
  cooperativadeahorroycredito29deoctubreltda: {
    credit: { primary: "#B8001C", secondary: "#5e000e" },
    debit: { primary: "#B8001C", secondary: "#5e000e" },
  },
  cooperativa23dejuliofinancoop: {
    credit: { primary: "#005B9A", secondary: "#00263e" },
    debit: { primary: "#005B9A", secondary: "#00263e" },
  },
  cooperativadaquilemafinancoop: {
    credit: { primary: "#C8001C", secondary: "#5e000e" },
    debit: { primary: "#C8001C", secondary: "#5e000e" },
  },
  cooperativamegofinancoop: {
    credit: { primary: "#005038", secondary: "#001f15" },
    debit: { primary: "#005038", secondary: "#001f15" },
  },
  cooperativamushucrunafinancoop: {
    credit: { primary: "#5CB800", secondary: "#2e5e00" },
    debit: { primary: "#5CB800", secondary: "#2e5e00" },
  },
  cooperativacacpeco: {
    credit: { primary: "#F0F0F0", secondary: "#888888" },
    debit: { primary: "#F0F0F0", secondary: "#888888" },
  },
  cooperativadeahorroycreditocacspmec: {
    credit: { primary: "#003087", secondary: "#001138" },
    debit: { primary: "#003087", secondary: "#001138" },
  },
  cacpmec: {
    credit: { primary: "#003087", secondary: "#001138" },
    debit: { primary: "#003087", secondary: "#001138" },
  },
  cooperativadeahorroycreditoandalucia: {
    credit: { primary: "#006837", secondary: "#002e18" },
    debit: { primary: "#006837", secondary: "#002e18" },
  },
  andalucia: {
    credit: { primary: "#006837", secondary: "#002e18" },
    debit: { primary: "#006837", secondary: "#002e18" },
  },
  cooperativadeahorroycreditochibuleo: {
    credit: { primary: "#CC1020", secondary: "#5e0810" },
    debit: { primary: "#CC1020", secondary: "#5e0810" },
  },
  chibuleo: {
    credit: { primary: "#CC1020", secondary: "#5e0810" },
    debit: { primary: "#CC1020", secondary: "#5e0810" },
  },
  cooperativadeahorroycreditocooprogresoltda: {
    credit: { primary: "#005B9A", secondary: "#00263e" },
    debit: { primary: "#005B9A", secondary: "#00263e" },
  },
  cooprogreso: {
    credit: { primary: "#005B9A", secondary: "#00263e" },
    debit: { primary: "#005B9A", secondary: "#00263e" },
  },
  cooperativadeahorroycreditodelapequenaempresadepastazaltda: {
    credit: { primary: "#1E8449", secondary: "#0d4621" },
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  cooperativadeahorroycreditooscus: {
    credit: { primary: "#C8C8C8", secondary: "#666666" },
    debit: { primary: "#C8C8C8", secondary: "#666666" },
  },
  oscus: {
    credit: { primary: "#C8C8C8", secondary: "#666666" },
    debit: { primary: "#C8C8C8", secondary: "#666666" },
  },
  cooperativadeahorroycreditopablomunozvega: {
    credit: { primary: "#006837", secondary: "#002e18" },
    debit: { primary: "#006837", secondary: "#002e18" },
  },
  cooperativapablomunozvega: {
    credit: { primary: "#006837", secondary: "#002e18" },
    debit: { primary: "#006837", secondary: "#002e18" },
  },
  cooperativadeahorroycreditotulcan: {
    credit: { primary: "#005B9A", secondary: "#00263e" },
    debit: { primary: "#005B9A", secondary: "#00263e" },
  },
  tulcan: {
    credit: { primary: "#005B9A", secondary: "#00263e" },
    debit: { primary: "#005B9A", secondary: "#00263e" },
  },
  cooperativajardinazuayo: {
    credit: { primary: "#1A3A6A", secondary: "#0a182e" },
    debit: { primary: "#1A3A6A", secondary: "#0a182e" },
  },
  jardinazuayo: {
    credit: { primary: "#1A3A6A", secondary: "#0a182e" },
    debit: { primary: "#1A3A6A", secondary: "#0a182e" },
  },
  cooperativadeahorroycreditoalianzadelvalleltda: {
    credit: { primary: "#004F9F", secondary: "#001f44" },
    debit: { primary: "#004F9F", secondary: "#001f44" },
  },
  alianzadelvalle: {
    credit: { primary: "#004F9F", secondary: "#001f44" },
    debit: { primary: "#004F9F", secondary: "#001f44" },
  },
  cooperativaatuntaquifinancoop: {
    credit: { primary: "#C8001C", secondary: "#5e000e" },
    debit: { primary: "#C8001C", secondary: "#5e000e" },
  },
  cooperativasagrariofinancoop: {
    credit: { primary: "#005FAA", secondary: "#002850" },
    debit: { primary: "#005FAA", secondary: "#002850" },
  },
  financoop: {
    debit: { primary: "#005FAA", secondary: "#002850" },
  },

  // ── Cooperativas pequeñas (verde genérico cooperativista) ──
  cooperativa15deabril: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  cooperativacacpepastaza: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  cooperativacrea: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  cooperativadeahorroycreditocrea: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  crea: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  cooperativadeahorroycreditodelapequenaempresabiblianltda: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  biblian: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  cooperativaeducadoreschimborazo: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  cooperativaerco: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  cooperativagualaquiza: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  cooperativaimbaburapakfinancoop: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  cooperativajulianlorentefinancoop: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  cooperativalamerced: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  cooperativasantarosafinancoop: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  cooperativaambatofinancoop: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  cooperativacredilfinancoop: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  cooperativapuellarofinancoop: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  cooperativasanmigueldelosbancos: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },
  coemisorcooperativalasnaves: {
    debit: { primary: "#1E8449", secondary: "#0d4621" },
  },

  // ── Otros / procesadores ──
  creditia: {
    credit: { primary: "#666666", secondary: "#333333" },
    debit: { primary: "#666666", secondary: "#333333" },
  },
};

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z]/g, "");
}

/**
 * Lookup the palette for a bank, optionally by card type.
 * Strategy:
 *  1. Find the bank's BankByType by normalized name (or substring match).
 *  2. Try to return the palette for the requested type.
 *  3. Fall back to credit → debit → first available type.
 */
export function lookupBankPalette(
  bankName: string | undefined,
  cardType?: CardType,
): BankPalette | null {
  if (!bankName) return null;
  const norm = normalize(bankName);
  if (!norm) return null;

  let bankByType: BankByType | undefined = BANK_PALETTES[norm];

  // Substring match for variations in bank naming
  if (!bankByType) {
    for (const key of Object.keys(BANK_PALETTES)) {
      if (norm.includes(key) && key.length >= 6) {
        bankByType = BANK_PALETTES[key];
        break;
      }
    }
  }

  if (!bankByType) return null;

  // Try requested type, then sensible fallbacks
  if (cardType && bankByType[cardType]) return bankByType[cardType]!;
  if (bankByType.credit) return bankByType.credit;
  if (bankByType.debit) return bankByType.debit;
  if (bankByType.prepaid) return bankByType.prepaid;
  return null;
}

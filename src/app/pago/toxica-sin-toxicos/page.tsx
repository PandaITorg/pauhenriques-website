import { redirect } from "next/navigation";

// Página legacy: el taller "Tóxica sin Tóxicos" se vendía aquí con
// pricing por tiers. El nuevo modelo lo vende vía paymentLinks
// (/pago/t/[token]). Sin token, no hay forma legítima de comprarlo —
// redirigimos al home.
export default function LegacyTallerToxicaPage() {
  redirect("/");
}

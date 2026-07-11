"use client";

import { useMemo, useState } from "react";
import DiscountTiersEditor, {
  fromEcuadorLocalInput,
  rawTierToDraft,
  type RawTier,
  type TierDraft,
} from "./DiscountTiersEditor";

const IVA_RATE = 0.15;

interface AutoDiscountsEditorProps {
  productId: string;
  /** Precio base SIN IVA del producto (product.price). */
  basePriceSubtotal: number;
  initialDiscounts?: RawTier[];
}

export default function AutoDiscountsEditor({
  productId,
  basePriceSubtotal,
  initialDiscounts = [],
}: AutoDiscountsEditorProps) {
  const [drafts, setDrafts] = useState<TierDraft[]>(() =>
    initialDiscounts.map(rawTierToDraft),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<
    { kind: "ok" | "error"; text: string } | null
  >(null);

  const basePriceWithVat = useMemo(
    () => Math.round(basePriceSubtotal * (1 + IVA_RATE) * 100) / 100,
    [basePriceSubtotal],
  );

  async function save() {
    setSaving(true);
    setMessage(null);

    try {
      const payload = drafts.map((d) => {
        const finalPrice = Number(d.finalPrice);
        const vu = fromEcuadorLocalInput(d.validUntilLocal);
        const pct = parseFloat(d.percentInput);
        const percentOff =
          d.inputMode === "pct" && !isNaN(pct) && pct >= 1 && pct <= 99
            ? Math.round(pct)
            : undefined;
        return {
          finalPrice,
          label: d.label.trim(),
          validUntil: vu ? vu.toISOString() : null,
          ...(percentOff !== undefined ? { percentOff } : {}),
        };
      });

      const res = await fetch(`/api/admin/products/${productId}/discounts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoDiscounts: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({
          kind: "error",
          text: data.error || "Error al guardar los descuentos",
        });
      } else {
        setMessage({
          kind: "ok",
          text: `Guardados ${data.count ?? payload.length} descuentos.`,
        });
      }
    } catch {
      setMessage({ kind: "error", text: "Error de conexión" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bg-surface-card border border-border-subtle rounded-xl p-6 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-main">
            Descuentos programados
          </h2>
          <p className="text-xs text-text-main/50 mt-1 leading-relaxed max-w-xl">
            Tiers de precio que se aplican automáticamente por fecha, sin
            necesidad de código de cupón. El primero vigente (fecha límite más
            cercana) es el que paga el cliente. Al vencer, pasa al siguiente
            automáticamente. Precio base regular: <strong className="text-text-main">
              ${basePriceWithVat.toFixed(2)}
            </strong> (IVA incluido).
          </p>
        </div>
      </header>

      <DiscountTiersEditor
        value={drafts}
        onChange={setDrafts}
        basePriceWithVat={basePriceWithVat}
        disabled={saving}
      />

      <div className="pt-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm cursor-pointer disabled:bg-surface-elevated disabled:text-text-main/30"
        >
          {saving ? (
            <>
              <div className="simple-spinner w-4! h-4! border-2! border-white! border-b-transparent!" />
              Guardando…
            </>
          ) : (
            "Guardar descuentos"
          )}
        </button>
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.kind === "ok" ? "text-success" : "text-error"
          }`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}

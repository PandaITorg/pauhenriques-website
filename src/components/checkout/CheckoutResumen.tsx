import { CartItem } from "@/stores/cart.store";

interface AppliedCoupon {
  code: string;
}

interface CheckoutResumenProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  shippingCost: number;
  appliedCoupon: AppliedCoupon | null;
}

export function CheckoutResumen({
  items,
  subtotal,
  discount,
  vat,
  total,
  shippingCost,
  appliedCoupon,
}: CheckoutResumenProps) {
  return (
    <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-xl sticky top-24">
      <h2 className="text-lg font-semibold text-text-main mb-4">Resumen</h2>
      <div className="space-y-2 text-sm">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-text-main/60">
            <span className="truncate mr-2">
              {item.name} x{item.quantity}
            </span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-border-subtle mt-4 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-main/50">Subtotal</span>
          <span className="font-medium text-text-main">
            ${subtotal.toFixed(2)}
          </span>
        </div>
        {appliedCoupon && discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-success">
              Descuento ({appliedCoupon.code})
            </span>
            <span className="font-medium text-success">
              -${discount.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-text-main/50">IVA (15%)</span>
          <span className="font-medium text-text-main">${vat.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-main/50">Envío</span>
          <span className="font-medium text-text-main">
            {shippingCost === 0 ? "Gratis" : `$${shippingCost.toFixed(2)}`}
          </span>
        </div>
        <div className="border-t border-border-subtle pt-3 flex justify-between font-bold text-lg text-primary">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

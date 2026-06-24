interface CartItem {
  price: number;
  quantity: number;
}

const IVA_RATE = 0.15;

export function calcCheckoutTotals(
  items: CartItem[],
  couponDiscount = 0,
): {
  subtotal: number;
  discount: number;
  discountedSubtotal: number;
  vat: number;
  total: number;
} {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = couponDiscount;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const vat = Math.round(discountedSubtotal * IVA_RATE * 100) / 100;
  const shippingCost = 0;
  const total = Math.round((discountedSubtotal + vat + shippingCost) * 100) / 100;
  return { subtotal, discount, discountedSubtotal, vat, total };
}

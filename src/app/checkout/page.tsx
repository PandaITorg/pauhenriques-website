"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore, CartItem } from "@/stores/cart.store";
import { useAuth } from "@/context/AuthContext";
import { FaTrash, FaMinus, FaPlus } from "react-icons/fa";
import NuveiPaymentForm from "@/components/checkout/NuveiPaymentForm";
import ProductPlaceholder from "@/components/ui/ProductPlaceholder";
import { createOrder } from "@/services/firestore/orderService";
import { ShippingAddress } from "@/types/order";

type Step = "cart" | "shipping" | "payment";

const CartItemRow = ({
  item,
  onRemove,
  onUpdateQty,
}: {
  item: CartItem;
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
}) => {
  const hasImage = item.images && item.images.length > 0;
  const firstImage = hasImage ? item.images[0].replace(/"/g, "").trim() : "";

  return (
    <div className="flex items-center gap-4 border-b border-gray-100 py-4">
      <div className="w-16 h-16 relative rounded-lg overflow-hidden shrink-0">
        {hasImage ? (
          <Image
            src={firstImage}
            alt={item.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <ProductPlaceholder className="w-full h-full" />
        )}
      </div>
      <div className="grow min-w-0">
        <h3 className="font-semibold text-text-inverted text-sm truncate">
          {item.name}
        </h3>
        <p className="text-xs text-gray-500">${item.price.toFixed(2)} c/u</p>
      </div>
      <div className="flex items-center border border-gray-200 rounded-lg">
        <button
          onClick={() => onUpdateQty(item.id, item.quantity - 1)}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <FaMinus className="w-2.5 h-2.5" />
        </button>
        <span className="px-2 text-sm font-medium min-w-6 text-center">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQty(item.id, item.quantity + 1)}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <FaPlus className="w-2.5 h-2.5" />
        </button>
      </div>
      <p className="font-semibold text-text-inverted text-sm w-20 text-right">
        ${(item.price * item.quantity).toFixed(2)}
      </p>
      <button
        onClick={() => onRemove(item.id)}
        className="text-red-400 hover:text-red-600 p-1"
      >
        <FaTrash className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default function CheckoutPage() {
  const [isClient, setIsClient] = useState(false);
  const [step, setStep] = useState<Step>("cart");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [shipping, setShipping] = useState<ShippingAddress>({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Ecuador",
  });

  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const shippingCost: number = 0; // TODO: Calculate based on address
  const total = subtotal + shippingCost;

  const isShippingValid =
    shipping.fullName &&
    shipping.phone &&
    shipping.address &&
    shipping.city &&
    shipping.province;

  const handleTokenSuccess = async (token: string) => {
    if (!user) {
      setPaymentError("Debes iniciar sesion para completar la compra.");
      return;
    }

    setProcessingPayment(true);
    setPaymentError(null);

    try {
      // Create order first
      const orderItems = items.map((item) => ({
        productId: item.id,
        name: item.name,
        brand: item.brand,
        price: item.price,
        quantity: item.quantity,
      }));

      const orderId = await createOrder({
        userId: user.uid,
        items: orderItems,
        subtotal,
        shipping: shippingCost,
        total,
        shippingAddress: shipping,
        paymentToken: token,
      });

      // Process payment
      const response = await fetch("/api/payment/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          orderId,
          amount: total,
          description: `Orden ${orderId} - Pau Henriques`,
          userId: user.uid,
          userEmail: user.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        clearCart();
        router.push(`/checkout/confirmacion?orderId=${orderId}`);
      } else {
        setPaymentError(data.error || "Error al procesar el pago.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setPaymentError("Error de conexion. Intenta de nuevo.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleTokenError = (error: any) => {
    setPaymentError(
      error?.description || "Error al procesar la tarjeta.",
    );
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="simple-spinner" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-5">
        <h1 className="text-2xl font-bold text-text-inverted mb-3">
          Tu carrito esta vacio
        </h1>
        <p className="text-gray-500 mb-6">Explora nuestra tienda</p>
        <Link
          href="/tienda"
          className="bg-background hover:bg-bosque-profundo-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Ir a la Tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-10 px-4 sm:px-6">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-2xl md:text-3xl font-bold text-text-inverted text-center mb-8">
          Checkout
        </h1>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(["cart", "shipping", "payment"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (s === "cart") setStep("cart");
                  if (s === "shipping" && items.length > 0) setStep("shipping");
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step === s
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {i + 1}
              </button>
              <span
                className={`text-sm hidden sm:block ${
                  step === s
                    ? "text-text-inverted font-medium"
                    : "text-gray-400"
                }`}
              >
                {s === "cart"
                  ? "Carrito"
                  : s === "shipping"
                    ? "Envio"
                    : "Pago"}
              </span>
              {i < 2 && (
                <div className="w-8 sm:w-12 h-px bg-gray-300 mx-1" />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {step === "cart" && (
              <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm">
                <h2 className="text-lg font-bold text-text-inverted mb-4">
                  Tu Carrito ({items.length} productos)
                </h2>
                {items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onRemove={removeItem}
                    onUpdateQty={updateQuantity}
                  />
                ))}
                <button
                  onClick={() => setStep("shipping")}
                  className="mt-6 w-full bg-background hover:bg-bosque-profundo-400 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Continuar al Envio
                </button>
              </div>
            )}

            {step === "shipping" && (
              <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm">
                <h2 className="text-lg font-bold text-text-inverted mb-4">
                  Datos de Envio
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        value={shipping.fullName}
                        onChange={(e) =>
                          setShipping({ ...shipping, fullName: e.target.value })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefono *
                      </label>
                      <input
                        type="tel"
                        value={shipping.phone}
                        onChange={(e) =>
                          setShipping({ ...shipping, phone: e.target.value })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Direccion *
                    </label>
                    <input
                      type="text"
                      value={shipping.address}
                      onChange={(e) =>
                        setShipping({ ...shipping, address: e.target.value })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        value={shipping.city}
                        onChange={(e) =>
                          setShipping({ ...shipping, city: e.target.value })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provincia *
                      </label>
                      <input
                        type="text"
                        value={shipping.province}
                        onChange={(e) =>
                          setShipping({ ...shipping, province: e.target.value })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Codigo Postal
                      </label>
                      <input
                        type="text"
                        value={shipping.postalCode}
                        onChange={(e) =>
                          setShipping({
                            ...shipping,
                            postalCode: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep("cart")}
                    className="flex-1 border border-gray-300 text-text-inverted font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={() => setStep("payment")}
                    disabled={!isShippingValid}
                    className="flex-1 bg-background hover:bg-bosque-profundo-400 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-300"
                  >
                    Continuar al Pago
                  </button>
                </div>
              </div>
            )}

            {step === "payment" && (
              <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm">
                <h2 className="text-lg font-bold text-text-inverted mb-4">
                  Datos de Pago
                </h2>

                {!user && (
                  <div className="bg-amber-50 text-amber-700 p-4 rounded-lg mb-4 text-sm">
                    Debes{" "}
                    <Link
                      href="/sign-in?redirect=/checkout"
                      className="font-bold underline"
                    >
                      iniciar sesion
                    </Link>{" "}
                    para completar la compra.
                  </div>
                )}

                {paymentError && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 text-sm">
                    {paymentError}
                  </div>
                )}

                <NuveiPaymentForm
                  onTokenSuccess={handleTokenSuccess}
                  onTokenError={handleTokenError}
                  disabled={!user || processingPayment}
                />

                <button
                  onClick={() => setStep("shipping")}
                  className="mt-4 w-full border border-gray-300 text-text-inverted font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Volver
                </button>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-text-inverted mb-4">
                Resumen
              </h2>
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-gray-600"
                  >
                    <span className="truncate mr-2">
                      {item.name} x{item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Envio</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? "Gratis" : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg text-text-inverted">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

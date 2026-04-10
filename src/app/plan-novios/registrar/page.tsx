"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { createPlan, isSlugAvailable, getPlanByUserId } from "@/services/firestore/planNoviosService";
import { productService } from "@/services/firestore/productService";
import type { CaricoProduct } from "@/types/product";
import type { SelectedProduct } from "@/types/planNovios";
import { HiOutlineCheck, HiOutlineMinus, HiOutlinePlus } from "react-icons/hi2";

const MINIMUM_PROGRAM_AMOUNT = 2000;

function generateSlug(name1: string, name2: string): string {
  const combined = `${name1}-y-${name2}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const year = new Date().getFullYear();
  return `${combined}-${year}`;
}

export default function RegistrarPlanPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [checkingExisting, setCheckingExisting] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [partner1Name, setPartner1Name] = useState("");
  const [partner2Name, setPartner2Name] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [message, setMessage] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  // Step 2 fields
  const [products, setProducts] = useState<CaricoProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selections, setSelections] = useState<Map<string, number>>(new Map());

  // Shared
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Redirect if user already has a plan
  useEffect(() => {
    if (authLoading || !user) {
      setCheckingExisting(false);
      return;
    }
    getPlanByUserId(user.uid).then((existing) => {
      if (existing) {
        router.replace("/plan-novios/mi-plan");
      } else {
        setCheckingExisting(false);
      }
    });
  }, [user, authLoading, router]);

  // Load products when entering step 2
  useEffect(() => {
    if (step !== 2 || products.length > 0) return;
    setProductsLoading(true);
    productService.getProductsByType("Carico").then((p) => {
      const carico = (p as CaricoProduct[]).filter(
        (prod) => prod.consultationPrice && prod.consultationPrice > 0,
      );
      setProducts(carico);
      setProductsLoading(false);
    });
  }, [step, products.length]);

  // Auto-generate slug
  const handleNameChange = (field: "partner1" | "partner2", value: string) => {
    if (field === "partner1") setPartner1Name(value);
    else setPartner2Name(value);
    if (!slugEdited) {
      const n1 = field === "partner1" ? value : partner1Name;
      const n2 = field === "partner2" ? value : partner2Name;
      if (n1 && n2) setSlug(generateSlug(n1, n2));
    }
  };

  // Calculate total from selections
  const calculateTotal = (): number => {
    let total = 0;
    selections.forEach((qty, productId) => {
      const product = products.find((p) => p.id === productId);
      if (product?.consultationPrice) {
        total += product.consultationPrice * qty;
      }
    });
    return total;
  };

  const meetsMinimum = calculateTotal() >= MINIMUM_PROGRAM_AMOUNT;

  // Toggle product selection
  const toggleProduct = (productId: string) => {
    setSelections((prev) => {
      const next = new Map(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.set(productId, 1);
      }
      return next;
    });
  };

  // Update quantity
  const updateQuantity = (productId: string, delta: number) => {
    setSelections((prev) => {
      const next = new Map(prev);
      const current = next.get(productId) || 1;
      const newQty = Math.max(1, Math.min(5, current + delta));
      next.set(productId, newQty);
      return next;
    });
  };

  // Step 1 → Step 2
  const handleNextStep = async () => {
    setError("");
    if (!partner1Name.trim() || !partner2Name.trim()) {
      setError("Los nombres de ambos son obligatorios");
      return;
    }
    if (!slug.trim()) {
      setError("El enlace personalizado es obligatorio");
      return;
    }

    const finalSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    setIsSubmitting(true);
    try {
      const available = await isSlugAvailable(finalSlug);
      if (!available) {
        setError("Este enlace ya esta en uso. Elige otro.");
        return;
      }
      setSlug(finalSlug);
      setStep(2);
    } catch {
      setError("Error al verificar el enlace. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Final submit
  const handleSubmit = async () => {
    if (!user || !meetsMinimum) return;

    setIsSubmitting(true);
    setError("");

    try {
      const selectedProducts: SelectedProduct[] = [];
      selections.forEach((qty, productId) => {
        const product = products.find((p) => p.id === productId);
        if (product) {
          selectedProducts.push({
            productId: product.id,
            productName: product.name,
            productImage: product.images?.[0] || "",
            quantity: qty,
          });
        }
      });

      const goalAmount = calculateTotal();

      await createPlan({
        partner1Name: partner1Name.trim(),
        partner2Name: partner2Name.trim(),
        weddingDate: weddingDate ? new Date(weddingDate) : null,
        message: message.trim(),
        userId: user.uid,
        userEmail: user.email || "",
        slug,
        selectedProducts,
        goalAmount,
      });

      router.push("/plan-novios/mi-plan");
    } catch (err) {
      console.error("Error creating plan:", err);
      setError("Error al crear el plan. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Loading / Auth guards ───

  if (authLoading || checkingExisting) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <div className="simple-spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background text-text-main">
        <div className="text-center">
          <h1 className="font-cormorant text-3xl font-semibold mb-4">Inicia Sesion</h1>
          <p className="text-text-main/70 mb-6">Necesitas una cuenta para crear tu Plan Novios.</p>
          <a
            href="/sign-up?redirect_uri=/plan-novios/registrar"
            className="bg-primary text-white font-semibold py-3 px-8 rounded-full hover:bg-primary-hover transition-all duration-200 cursor-pointer"
          >
            Crear Cuenta
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-text-main min-h-screen py-8 px-5">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="font-dancing-script text-primary text-lg mb-1">Carico</p>
          <h1 className="font-cormorant text-3xl md:text-4xl font-semibold mb-2">
            Registra tu Plan Novios
          </h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? "bg-primary text-white" : "bg-warm-200 text-warm-600"}`}>
              1
            </div>
            <span className={`text-xs hidden sm:inline ${step === 1 ? "text-text-main" : "text-text-main/40"}`}>
              Datos
            </span>
          </div>
          <div className={`w-12 h-px ${step >= 2 ? "bg-primary" : "bg-warm-200"}`} />
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? "bg-primary text-white" : "bg-warm-200 text-warm-600"}`}>
              2
            </div>
            <span className={`text-xs hidden sm:inline ${step === 2 ? "text-text-main" : "text-text-main/40"}`}>
              Productos
            </span>
          </div>
        </div>

        {/* ─── Step 1: Details ─── */}
        {step === 1 && (
          <div className="bg-surface-card border border-border-default rounded-xl p-6 md:p-8">
            <div className="mb-4">
              <label htmlFor="partner1" className="block text-sm font-medium mb-1.5 text-text-main/80">
                Nombre del Novio/a 1 *
              </label>
              <input
                type="text"
                id="partner1"
                value={partner1Name}
                onChange={(e) => handleNameChange("partner1", e.target.value)}
                className="w-full px-3 py-2.5 bg-input-bg border border-border-default rounded-lg focus:outline-none focus:border-primary text-text-main"
                placeholder="Maria"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="partner2" className="block text-sm font-medium mb-1.5 text-text-main/80">
                Nombre del Novio/a 2 *
              </label>
              <input
                type="text"
                id="partner2"
                value={partner2Name}
                onChange={(e) => handleNameChange("partner2", e.target.value)}
                className="w-full px-3 py-2.5 bg-input-bg border border-border-default rounded-lg focus:outline-none focus:border-primary text-text-main"
                placeholder="Juan"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="weddingDate" className="block text-sm font-medium mb-1.5 text-text-main/80">
                Fecha de la Boda <span className="text-text-main/40">(opcional)</span>
              </label>
              <input
                type="date"
                id="weddingDate"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-input-bg border border-border-default rounded-lg focus:outline-none focus:border-primary text-text-main"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="message" className="block text-sm font-medium mb-1.5 text-text-main/80">
                Mensaje para tus Invitados <span className="text-text-main/40">(opcional)</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2.5 bg-input-bg border border-border-default rounded-lg focus:outline-none focus:border-primary text-text-main resize-none"
                placeholder="Gracias por acompanarnos en este dia especial..."
              />
            </div>

            <div className="mb-6">
              <label htmlFor="slug" className="block text-sm font-medium mb-1.5 text-text-main/80">
                Enlace Personalizado *
              </label>
              <div className="flex items-center gap-1 text-sm text-text-main/50 mb-1">
                <span>pauhenriques.com/plan-novios/</span>
              </div>
              <input
                type="text"
                id="slug"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
                className="w-full px-3 py-2.5 bg-input-bg border border-border-default rounded-lg focus:outline-none focus:border-primary text-text-main font-mono text-sm"
                placeholder="maria-y-juan-2026"
                required
              />
              <p className="text-text-main/40 text-xs mt-1">
                Este es el enlace que compartiras con tus invitados
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleNextStep}
              disabled={isSubmitting}
              className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? "Verificando..." : "Siguiente"}
            </button>
          </div>
        )}

        {/* ─── Step 2: Product Selector ─── */}
        {step === 2 && (
          <div>
            <p className="text-text-main/60 text-sm text-center mb-6">
              Selecciona los productos Carico que deseas para tu nuevo hogar.
            </p>

            {/* Product grid */}
            {productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-surface-card border border-border-default rounded-xl p-4 animate-pulse">
                    <div className="w-full aspect-square bg-surface-elevated rounded-lg mb-3" />
                    <div className="h-4 bg-surface-elevated rounded w-3/4 mb-2" />
                    <div className="h-3 bg-surface-elevated rounded w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {products.map((product) => {
                  const isSelected = selections.has(product.id);
                  const qty = selections.get(product.id) || 1;

                  return (
                    <div
                      key={product.id}
                      className={`relative bg-surface-card rounded-xl overflow-hidden transition-all cursor-pointer ${
                        isSelected
                          ? "border-2 border-primary ring-2 ring-primary/20"
                          : "border border-border-default hover:border-primary/30"
                      }`}
                      onClick={() => toggleProduct(product.id)}
                    >
                      {/* Checkmark */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <HiOutlineCheck className="w-4 h-4 text-white" />
                        </div>
                      )}

                      {/* Image */}
                      {product.images?.[0] ? (
                        <div className="relative w-full aspect-square bg-surface-elevated">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-contain p-3"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-square bg-surface-elevated flex items-center justify-center text-text-main/20 text-3xl">
                          ?
                        </div>
                      )}

                      {/* Info */}
                      <div className="p-3">
                        <p className="text-[10px] uppercase tracking-wider text-text-main/40 mb-0.5">
                          {product.brand}
                        </p>
                        <h4 className="text-sm font-medium text-text-main leading-tight line-clamp-2">
                          {product.name}
                        </h4>
                      </div>

                      {/* Quantity control — only when selected */}
                      {isSelected && (
                        <div
                          className="flex items-center justify-center gap-3 px-3 pb-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => updateQuantity(product.id, -1)}
                            className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer"
                            aria-label="Reducir cantidad"
                          >
                            <HiOutlineMinus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-medium w-4 text-center">{qty}</span>
                          <button
                            onClick={() => updateQuantity(product.id, 1)}
                            className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer"
                            aria-label="Aumentar cantidad"
                          >
                            <HiOutlinePlus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom bar: status + buttons */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border-subtle -mx-5 px-5 py-4 mt-4">
              {/* Minimum status message */}
              {selections.size > 0 && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  meetsMinimum
                    ? "bg-success/10 border border-success/20 text-success"
                    : "bg-warning/10 border border-warning/20 text-warning"
                }`}>
                  {meetsMinimum
                    ? "Tu seleccion cumple con los requisitos del programa"
                    : "Agrega mas productos a tu lista para cumplir con los requisitos del programa"
                  }
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep(1); setError(""); }}
                  className="px-6 py-3 border border-border-default rounded-lg text-text-main/60 hover:text-text-main transition-colors cursor-pointer"
                >
                  Atras
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !meetsMinimum || selections.size === 0}
                  className="flex-1 bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? "Creando Plan..." : "Crear Plan Novios"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

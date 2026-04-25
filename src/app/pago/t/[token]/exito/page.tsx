import Link from "next/link";
import { notFound } from "next/navigation";
import { FaCheckCircle, FaEnvelope, FaWhatsapp } from "react-icons/fa";

import { getPaymentLinkBootstrap } from "@/lib/pago-link/linkBootstrap";

// Número general del sitio (Maria Paula Henriques) — fallback cuando el
// taller no define un whatsappContact propio. Ver CLAUDE.md.
const DEFAULT_WHATSAPP = "593991712532";

interface ExitoPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ orderId?: string; review?: string }>;
}

export const metadata = {
  title: "Pago confirmado · Pau Henriques",
  robots: { index: false, follow: false },
};

export default async function ExitoPage({ params, searchParams }: ExitoPageProps) {
  const { token } = await params;
  const sp = await searchParams;
  const orderId = sp.orderId;
  const isReview = sp.review === "1";

  const bootstrap = await getPaymentLinkBootstrap(token);
  if (!bootstrap.ok) {
    notFound();
  }

  const taller = bootstrap.taller;
  const whatsapp = taller.whatsappContact || DEFAULT_WHATSAPP;
  const whatsappText = encodeURIComponent(
    `Acabo de realizar el pago con tarjeta del taller ${taller.name}`,
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-5 sm:px-6 py-16 md:py-24">
        <div className="bg-surface-card border border-border-subtle rounded-xl p-6 sm:p-8 text-center">
          <FaCheckCircle className="w-14 h-14 text-success mx-auto mb-5" />
          <h1 className="font-cormorant text-3xl md:text-4xl font-semibold text-text-main mb-3">
            {isReview ? "Pago recibido" : "¡Pago confirmado!"}
          </h1>
          <p className="text-text-main/60 text-sm sm:text-base leading-relaxed">
            {isReview
              ? "Tu pago está siendo revisado por el banco. Te avisaremos por correo en las próximas horas cuando quede confirmado."
              : `Gracias por tu compra del taller "${taller.name}".`}
          </p>

          {orderId && (
            <p className="mt-4 text-xs text-text-main/40">
              Orden{" "}
              <span className="font-mono text-text-main/60">
                #{orderId.slice(0, 8)}
              </span>
            </p>
          )}

          <div className="mt-8 p-5 rounded-xl bg-primary/5 border border-primary/20 text-left">
            <div className="flex items-start gap-3">
              <FaEnvelope className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text-main">
                  Revisa tu correo
                </p>
                <p className="text-xs text-text-main/60 mt-1 leading-relaxed">
                  {taller.postPurchaseNote}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 border border-border-default text-text-main/70 hover:bg-surface-elevated font-medium py-3 px-5 rounded-xl transition-colors text-sm"
            >
              Volver al inicio
            </Link>
            <a
              href={`https://wa.me/${whatsapp}?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-5 rounded-xl transition-colors text-sm"
            >
              <FaWhatsapp className="w-4 h-4" />
              Escríbenos por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

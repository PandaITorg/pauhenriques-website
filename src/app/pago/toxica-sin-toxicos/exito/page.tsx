import Link from "next/link";
import { FaCheckCircle, FaEnvelope, FaWhatsapp } from "react-icons/fa";

import { CURSO_TOXICA_SIN_TOXICOS } from "@/lib/pago-link/course";

interface ExitoPageProps {
  searchParams: Promise<{ orderId?: string; review?: string }>;
}

export const metadata = {
  title: "Pago confirmado · Pau Henriques",
  robots: { index: false, follow: false },
};

export default async function ExitoPage({ searchParams }: ExitoPageProps) {
  const params = await searchParams;
  const orderId = params.orderId;
  const isReview = params.review === "1";

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
              : `Gracias por tu compra del curso "${CURSO_TOXICA_SIN_TOXICOS.name}".`}
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
                  Te acabamos de enviar el comprobante de pago. El acceso al curso
                  te llegará en un máximo de 24 horas. Si no lo recibís, revisá
                  spam o escríbenos.
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
              href="https://wa.me/593997733498"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-5 rounded-xl transition-colors text-sm"
            >
              <FaWhatsapp className="w-4 h-4" />
              Escribinos por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { getPaymentLinkBootstrap } from "@/lib/pago-link/linkBootstrap";
import PagoLinkClient from "./PagoLinkClient";

export const metadata = {
  title: "Pago seguro · Pau Henriques",
  robots: { index: false, follow: false },
};

interface PagoLinkPageProps {
  params: Promise<{ token: string }>;
}

export default async function PagoLinkPage({ params }: PagoLinkPageProps) {
  const { token } = await params;
  const bootstrap = await getPaymentLinkBootstrap(token);

  if (!bootstrap.ok) {
    if (bootstrap.code === "not-found") notFound();
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-5">
        <h1 className="font-cormorant text-2xl font-semibold text-text-main mb-2">
          {bootstrap.code === "expired"
            ? "Este link expiró"
            : bootstrap.code === "inactive"
              ? "Este link fue desactivado"
              : "No se pudo cargar el pago"}
        </h1>
        <p className="text-text-main/60 text-sm max-w-xs">
          {bootstrap.error}. Contactá al organizador para que te envíe un nuevo
          link.
        </p>
      </div>
    );
  }

  return (
    <PagoLinkClient
      taller={bootstrap.taller}
      pricing={bootstrap.pricing}
      paymentLinkId={bootstrap.linkId}
      paymentDescription={`Taller ${bootstrap.taller.name}`}
      successUrlPattern={`/pago/t/${token}/exito?orderId={ORDER_ID}`}
    />
  );
}

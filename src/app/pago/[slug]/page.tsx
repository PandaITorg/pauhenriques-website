import { notFound } from "next/navigation";
import { getTallerBootstrapBySlug } from "@/lib/talleres/bootstrap";
import PagoLinkClient from "@/app/pago/t/[token]/PagoLinkClient";

// Link OFICIAL del taller — público, indexable, compartido en redes/marca.
// Precio dinámico vía discountTiers programados por fecha (basePrice si no
// hay tier vigente). NO depende de paymentLinks (esos son solo para
// negociaciones privadas vía /pago/t/[token]).

export const dynamic = "force-dynamic";

interface PagoTallerPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PagoTallerPageProps) {
  try {
    const { slug } = await params;
    const bootstrap = await getTallerBootstrapBySlug(slug);
    if (!bootstrap.ok) {
      return { title: "Pago seguro · Pau Henriques", robots: { index: false } };
    }
    return {
      title: `${bootstrap.taller.name} · Pago seguro`,
      description: bootstrap.taller.shortDescription,
    };
  } catch {
    return { title: "Pago seguro · Pau Henriques", robots: { index: false } };
  }
}

export default async function PagoTallerPage({ params }: PagoTallerPageProps) {
  const { slug } = await params;

  let bootstrap: Awaited<ReturnType<typeof getTallerBootstrapBySlug>>;
  try {
    bootstrap = await getTallerBootstrapBySlug(slug);
  } catch (err) {
    console.error(`[/pago/${slug}] bootstrap threw:`, err);
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-5">
        <h1 className="font-cormorant text-2xl font-semibold text-text-main mb-2">
          No se pudo cargar el taller
        </h1>
        <p className="text-text-main/60 text-sm max-w-xs">
          Error inesperado al consultar la base. Recargá la página o avisá al
          organizador.
        </p>
      </div>
    );
  }

  if (!bootstrap.ok) {
    if (bootstrap.code === "not-found") notFound();
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-5">
        <h1 className="font-cormorant text-2xl font-semibold text-text-main mb-2">
          Este taller no está disponible
        </h1>
        <p className="text-text-main/60 text-sm max-w-xs">{bootstrap.error}.</p>
      </div>
    );
  }

  return (
    <PagoLinkClient
      taller={bootstrap.taller}
      pricing={bootstrap.pricing}
      paymentDescription={`Taller ${bootstrap.taller.name}`}
      successUrlPattern={`/pago/${slug}/exito?orderId={ORDER_ID}`}
    />
  );
}

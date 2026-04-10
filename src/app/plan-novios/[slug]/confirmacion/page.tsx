"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount") || "0";
  const name = searchParams.get("name") || "Invitado";

  return (
    <div className="bg-background text-text-main min-h-screen flex items-center justify-center py-8 px-5">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-surface-card border border-border-default rounded-xl p-8 md:p-10">
          {/* Success icon */}
          <div className="w-16 h-16 bg-success/10 border-2 border-success/25 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-success text-3xl">&#10003;</span>
          </div>

          <p className="font-dancing-script text-primary text-lg mb-2">Plan Novios Carico</p>

          <h1 className="font-cormorant text-2xl md:text-3xl font-semibold mb-4">
            Gracias, {decodeURIComponent(name)}!
          </h1>

          <p className="text-text-main/70 mb-6">
            Tu contribucion de{" "}
            <span className="text-primary font-semibold text-lg">
              ${parseFloat(amount).toFixed(2)}
            </span>{" "}
            fue registrada exitosamente. Los novios seran notificados de tu regalo.
          </p>

          {/* Divider */}
          <div className="border-t border-border-subtle my-6" />

          <p className="text-text-main/50 text-sm mb-6">
            Si proporcionaste tu email, recibiras una confirmacion en tu correo.
          </p>

          <Link
            href="/plan-novios"
            className="inline-block bg-primary text-white font-semibold py-3 px-8 rounded-full hover:bg-primary-hover transition-all duration-200 cursor-pointer"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background text-text-main min-h-screen flex items-center justify-center">
          <div className="simple-spinner" />
        </div>
      }
    >
      <ConfirmacionContent />
    </Suspense>
  );
}

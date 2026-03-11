"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ThreeDSReturn() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // The ACS posts to this URL after the challenge completes.
    // We signal the parent checkout window via postMessage.
    const orderId = searchParams.get("orderId") || "";
    const message = { type: "3DS_COMPLETE", orderId };

    // Try parent (iframe context) first, then opener (popup context)
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, "*");
    } else if (window.opener) {
      window.opener.postMessage(message, "*");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="simple-spinner" />
        <p className="text-text-main/60 text-sm">Verificando autenticación...</p>
      </div>
    </div>
  );
}

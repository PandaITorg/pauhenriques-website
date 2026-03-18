"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="bg-background text-text-main font-sans antialiased">
        <main className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
          <h1 className="text-2xl font-semibold mb-3">Algo salio mal</h1>
          <p className="text-sm opacity-60 mb-8">
            Ocurrio un error critico. Por favor, intenta de nuevo.
          </p>
          <button
            onClick={reset}
            className="bg-[#a68a63] text-white rounded-xl font-semibold text-sm py-3 px-6"
          >
            Volver a intentar
          </button>
        </main>
      </body>
    </html>
  );
}

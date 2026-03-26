"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center px-5 text-center">
      <div className="w-16 h-16 rounded-full bg-error/15 flex items-center justify-center mb-6">
        <span className="text-error text-2xl">!</span>
      </div>
      <h1 className="font-cormorant text-2xl sm:text-3xl font-semibold text-text-main mb-3">
        Algo salio mal
      </h1>
      <p className="text-sm text-text-main/60 mb-8 max-w-md">
        Ocurrio un error inesperado. Por favor, intenta de nuevo.
      </p>
      <button
        onClick={reset}
        className="bg-primary text-white rounded-xl font-semibold text-sm py-3 px-6 transition-all duration-200 hover:bg-primary-hover hover:-translate-y-px hover:shadow-(--shadow-glow-primary)"
      >
        Volver a intentar
      </button>
    </main>
  );
}

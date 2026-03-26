import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center px-5 text-center">
      <p className="text-8xl font-cormorant font-bold text-primary/30 mb-4">
        404
      </p>
      <h1 className="font-cormorant text-2xl sm:text-3xl font-semibold text-text-main mb-3">
        Pagina no encontrada
      </h1>
      <p className="text-sm text-text-main/60 mb-8 max-w-md">
        Lo sentimos, la pagina que buscas no existe o fue movida.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="bg-primary text-white rounded-xl font-semibold text-sm py-3 px-6 transition-all duration-200 hover:bg-primary-hover hover:-translate-y-px hover:shadow-(--shadow-glow-primary)"
        >
          Ir al inicio
        </Link>
        <Link
          href="/tienda"
          className="border border-primary/40 text-primary rounded-xl font-semibold text-sm py-3 px-6 transition-all duration-200 hover:bg-primary/10"
        >
          Ver la tienda
        </Link>
      </div>
    </main>
  );
}

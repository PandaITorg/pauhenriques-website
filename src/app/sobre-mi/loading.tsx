export default function SobreMiLoading() {
  return (
    <div className="min-h-screen bg-tertiary px-5 sm:px-8 md:px-20 py-8 md:py-12">
      {/* Title skeleton */}
      <div className="h-9 w-48 bg-bosque-profundo-400/20 rounded mx-auto mb-8 md:mb-12 animate-pulse" />
      {/* Content section skeleton */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 mb-12">
        <div className="md:w-1/2 space-y-4 w-full animate-pulse">
          <div className="h-7 bg-bosque-profundo-400/20 rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-4 bg-bosque-profundo-400/15 rounded w-full" />
            <div className="h-4 bg-bosque-profundo-400/15 rounded w-full" />
            <div className="h-4 bg-bosque-profundo-400/15 rounded w-5/6" />
            <div className="h-4 bg-bosque-profundo-400/15 rounded w-full" />
            <div className="h-4 bg-bosque-profundo-400/15 rounded w-2/3" />
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <div className="w-full max-w-sm aspect-[3/4] bg-bosque-profundo-400/20 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}

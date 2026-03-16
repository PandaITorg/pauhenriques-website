export default function PodcastLoading() {
  return (
    <div className="min-h-screen bg-tertiary px-5 sm:px-8 md:px-20 py-8 md:py-12">
      {/* Title skeleton */}
      <div className="h-9 w-56 bg-bosque-profundo-400/20 rounded mx-auto mb-8 animate-pulse" />
      {/* Podcast cover + info skeleton */}
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 mb-12">
        <div className="w-48 h-48 bg-bosque-profundo-400/20 rounded-xl animate-pulse shrink-0" />
        <div className="flex-1 space-y-3 w-full animate-pulse">
          <div className="h-6 bg-bosque-profundo-400/20 rounded w-3/4" />
          <div className="h-4 bg-bosque-profundo-400/15 rounded w-full" />
          <div className="h-4 bg-bosque-profundo-400/15 rounded w-5/6" />
          <div className="flex gap-3 mt-4">
            <div className="h-10 w-32 bg-bosque-profundo-400/20 rounded-full" />
            <div className="h-10 w-32 bg-bosque-profundo-400/20 rounded-full" />
          </div>
        </div>
      </div>
      {/* Episodes list skeleton */}
      <div className="max-w-4xl mx-auto space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-card border border-border-subtle rounded-xl p-5 animate-pulse"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-bosque-profundo-400/20 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-bosque-profundo-400/20 rounded w-2/3" />
                <div className="h-3 bg-bosque-profundo-400/15 rounded w-full" />
                <div className="h-3 bg-bosque-profundo-400/15 rounded w-4/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

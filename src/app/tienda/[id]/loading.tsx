export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-tertiary">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        {/* Back button skeleton */}
        <div className="h-5 w-32 bg-bosque-profundo-400/20 rounded mb-6 animate-pulse" />

        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Image gallery skeleton */}
          <div className="md:w-1/2">
            <div className="w-full aspect-square bg-bosque-profundo-400/20 rounded-xl animate-pulse" />
            <div className="flex gap-2 mt-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-16 h-16 bg-bosque-profundo-400/15 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Product info skeleton */}
          <div className="md:w-1/2 space-y-4 animate-pulse">
            <div className="h-3 w-20 bg-bosque-profundo-400/20 rounded" />
            <div className="h-8 w-3/4 bg-bosque-profundo-400/20 rounded" />
            <div className="space-y-2">
              <div className="h-4 bg-bosque-profundo-400/15 rounded w-full" />
              <div className="h-4 bg-bosque-profundo-400/15 rounded w-full" />
              <div className="h-4 bg-bosque-profundo-400/15 rounded w-2/3" />
            </div>
            <div className="h-8 w-28 bg-bosque-profundo-400/20 rounded mt-4" />
            <div className="h-12 bg-bosque-profundo-400/20 rounded-xl mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

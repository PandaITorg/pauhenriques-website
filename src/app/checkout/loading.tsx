export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-tertiary">
      <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        {/* Step indicator skeleton */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-bosque-profundo-400/20 animate-pulse" />
              {i < 3 && (
                <div className="w-12 h-px bg-bosque-profundo-400/15" />
              )}
            </div>
          ))}
        </div>
        {/* Cart items skeleton */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4 animate-pulse">
              <div className="w-16 h-16 bg-bosque-profundo-400/20 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-bosque-profundo-400/20 rounded w-2/3" />
                <div className="h-3 bg-bosque-profundo-400/20 rounded w-1/3" />
              </div>
              <div className="h-6 w-16 bg-bosque-profundo-400/20 rounded" />
            </div>
          ))}
          {/* Total skeleton */}
          <div className="border-t border-border-subtle pt-4 flex justify-between animate-pulse">
            <div className="h-5 w-16 bg-bosque-profundo-400/20 rounded" />
            <div className="h-5 w-24 bg-bosque-profundo-400/20 rounded" />
          </div>
        </div>
        {/* CTA skeleton */}
        <div className="mt-6 h-12 bg-bosque-profundo-400/20 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

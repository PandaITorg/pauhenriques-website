import Skeleton from "@/components/ui/Skeleton";

export default function MiCuentaLoading() {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-14 md:py-20">
      <Skeleton className="h-10 w-40 mb-8" />

      <div className="flex gap-3 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32 rounded-xl" />
        ))}
      </div>

      <div className="bg-surface-card border border-border-subtle rounded-xl p-6 space-y-5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

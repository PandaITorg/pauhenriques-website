import Skeleton from "@/components/ui/Skeleton";

export default function MisPedidosLoading() {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-14 md:py-20">
      <Skeleton className="h-10 w-44 mb-8" />

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="card" className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

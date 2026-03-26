import Skeleton from "@/components/ui/Skeleton";

export default function TiendaLoading() {
  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-14 md:py-20">
      <Skeleton className="h-10 w-48 mb-3" />
      <Skeleton className="h-5 w-72 mb-10" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="card" className="h-80" />
        ))}
      </div>
    </div>
  );
}

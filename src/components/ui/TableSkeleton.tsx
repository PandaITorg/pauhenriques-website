/**
 * Skeleton de tabla genérico para reemplazar spinners en tablas admin.
 * Renderiza N filas con cells del ancho aproximado de las columnas
 * reales — reduce CLS (layout shift) cuando los datos cargan.
 */
interface TableSkeletonProps {
  /** Cantidad de filas placeholder. Default: 5. */
  rows?: number;
  /** Anchos relativos de cada columna (% o "auto"). Default: 6 columnas iguales. */
  columnWidths?: string[];
  /** Si true, primera columna más prominente (avatar/título). */
  showLeading?: boolean;
}

const DEFAULT_COLS = ["18%", "22%", "16%", "14%", "14%", "16%"];

export default function TableSkeleton({
  rows = 5,
  columnWidths = DEFAULT_COLS,
  showLeading = false,
}: TableSkeletonProps) {
  return (
    <div className="overflow-hidden">
      <div className="border-b border-border-subtle bg-surface-elevated p-4 grid gap-4 animate-pulse"
        style={{
          gridTemplateColumns: columnWidths.join(" "),
        }}
      >
        {columnWidths.map((_, i) => (
          <div key={i} className="h-3 bg-text-main/15 rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="border-b border-border-subtle p-4 grid gap-4 items-center last:border-b-0 animate-pulse"
          style={{
            gridTemplateColumns: columnWidths.join(" "),
            // Stagger para que se sienta vivo
            animationDelay: `${r * 80}ms`,
          }}
        >
          {columnWidths.map((_, c) => (
            <div key={c}>
              {c === 0 && showLeading ? (
                <div className="space-y-2">
                  <div className="h-3 w-3/4 bg-text-main/10 rounded" />
                  <div className="h-2 w-1/2 bg-text-main/10 rounded" />
                </div>
              ) : (
                <div className="h-3 bg-text-main/10 rounded w-3/4" />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

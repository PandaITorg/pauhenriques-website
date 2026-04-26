"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import TableSkeleton from "@/components/ui/TableSkeleton";

export interface DataTableColumn<T> {
  /** Identificador único de la columna (usado como key + para sort). */
  key: string;
  /** Header de la columna. */
  header: ReactNode;
  /** Render de la celda. Recibe el row entero. */
  cell: (row: T, index: number) => ReactNode;
  /** Si true, columna sortable. Necesita `getSortValue` o se usa cell text como fallback. */
  sortable?: boolean;
  /** Función para extraer el valor a comparar al sortear. */
  getSortValue?: (row: T) => string | number | null;
  /** Alineación. Default: "left". */
  align?: "left" | "right" | "center";
  /** Ancho fijo (CSS) o "auto". */
  width?: string;
  /** className adicional en la celda. */
  cellClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  /** Función para sacar key única de cada fila. */
  rowKey: (row: T) => string;
  loading?: boolean;
  /** Search bar. Si está, busca en los campos definidos por searchFields. */
  searchPlaceholder?: string;
  /** Callback con el query actual para que el padre lo use externamente. */
  onSearchChange?: (query: string) => void;
  /** Filtra rows usando este callback (recibe query lowercased). */
  searchFilter?: (row: T, query: string) => boolean;
  /** Tamaño de página. Default: 50. Pasar 0 para deshabilitar. */
  pageSize?: number;
  /** Mensaje cuando no hay datos. */
  emptyMessage?: ReactNode;
  /** Click en fila. */
  onRowClick?: (row: T) => void;
  /** Sort por defecto. */
  defaultSortKey?: string;
  defaultSortDir?: "asc" | "desc";
}

type SortDir = "asc" | "desc";

/**
 * Tabla data-driven reutilizable. Soporta:
 *   - Sort por columna (con getSortValue o fallback a cell text)
 *   - Search inline (con searchFilter callback custom)
 *   - Paginación (configurable, default 50)
 *   - Loading skeleton
 *   - Click en fila
 *   - Mobile: scroll horizontal con overflow-x-auto
 *
 * No migra las tablas existentes automáticamente — usar para
 * tablas nuevas o migrar gradualmente cuando convenga.
 */
export default function DataTable<T>({
  data,
  columns,
  rowKey,
  loading,
  searchPlaceholder,
  onSearchChange,
  searchFilter,
  pageSize = 50,
  emptyMessage = "Sin resultados.",
  onRowClick,
  defaultSortKey,
  defaultSortDir = "desc",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null);
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim() || !searchFilter) return data;
    const q = search.trim().toLowerCase();
    return data.filter((row) => searchFilter(row, q));
  }, [data, search, searchFilter]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.sortable) return filtered;
    const getter =
      col.getSortValue ??
      ((row: T) => {
        const cell = col.cell(row, 0);
        return typeof cell === "string" || typeof cell === "number"
          ? cell
          : String(cell ?? "");
      });
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = getter(a);
      const bv = getter(b);
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = av < bv ? -1 : 1;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const paged =
    pageSize > 0
      ? sorted.slice((safePage - 1) * pageSize, safePage * pageSize)
      : sorted;

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(defaultSortDir);
    }
  };

  return (
    <>
      {searchPlaceholder && (
        <div className="relative mb-4">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-main/30" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
              onSearchChange?.(e.target.value);
            }}
            className="bg-input-bg border border-border-default rounded-xl text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 w-full pl-9 pr-3 py-2.5"
          />
        </div>
      )}

      <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden">
        {loading ? (
          <TableSkeleton
            rows={Math.min(pageSize || 6, 6)}
            showLeading
            columnWidths={columns.map(
              (c) => c.width ?? `${Math.floor(100 / columns.length)}%`,
            )}
          />
        ) : sorted.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-main/50">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-elevated">
                  {columns.map((col) => {
                    const align = col.align ?? "left";
                    const active = col.sortable && sortKey === col.key;
                    const Icon = !active
                      ? FaSort
                      : sortDir === "asc"
                        ? FaSortUp
                        : FaSortDown;
                    return (
                      <th
                        key={col.key}
                        style={col.width ? { width: col.width } : undefined}
                        className={`text-${align} p-4 font-medium text-text-main/50`}
                      >
                        {col.sortable ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(col.key)}
                            className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-text-main transition-colors ${
                              active ? "text-primary" : ""
                            }`}
                          >
                            {col.header}
                            <Icon className="w-3 h-3 opacity-70" />
                          </button>
                        ) : (
                          col.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {paged.map((row, i) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`border-b border-border-subtle hover:bg-surface-elevated transition-colors last:border-b-0 align-top ${
                      onRowClick ? "cursor-pointer" : ""
                    }`}
                  >
                    {columns.map((col) => {
                      const align = col.align ?? "left";
                      return (
                        <td
                          key={col.key}
                          className={`text-${align} p-4 ${col.cellClassName ?? ""}`}
                        >
                          {col.cell(row, i)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && sorted.length > 0 && pageSize > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-text-main/50">
            Mostrando{" "}
            <strong className="text-text-main">
              {(safePage - 1) * pageSize + 1}
            </strong>
            –
            <strong className="text-text-main">
              {Math.min(safePage * pageSize, sorted.length)}
            </strong>{" "}
            de <strong className="text-text-main">{sorted.length}</strong>
          </p>
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="inline-flex items-center gap-1 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <FaChevronLeft className="w-2.5 h-2.5" />
              Anterior
            </button>
            <span className="text-xs text-text-main/50 px-2 min-w-16 text-center">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="inline-flex items-center gap-1 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Siguiente
              <FaChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

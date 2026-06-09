"use client";

import { useState, useMemo } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import type { Pago, EstadoPago } from "@/lib/types";

const PAGE_SIZE = 5;

const ESTADO_STYLES: Record<EstadoPago, string> = {
  completed:
    "bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent-ink)] border-[color:var(--color-accent)]/30",
  refunded:
    "bg-[color:var(--color-warn-soft)] text-[color:var(--color-warn-ink)] border-[color:var(--color-warn)]/35",
  failed:
    "bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger-ink)] border-[color:var(--color-danger)]/35",
};

export function PagosList({ pagos }: { pagos: Pago[] }) {
  const [page, setPage] = useState(0);

  const sorted = useMemo(
    () =>
      [...pagos].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)),
    [pagos],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const rows = sorted.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <div className="card overflow-hidden">
      <div className="flex items-baseline justify-between px-6 pt-5 pb-3">
        <div className="label-eyebrow">Pagos recientes</div>
        <div className="text-xs text-[color:var(--color-muted)] mono">
          {sorted.length === 0
            ? "0 resultados"
            : `${safePage * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE + PAGE_SIZE, sorted.length)} de ${sorted.length}`}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-[color:var(--color-muted)]">
          No hay pagos que coincidan con los filtros.
        </div>
      ) : (
        <div className="px-2">
          {rows.map((p) => (
            <div
              key={p.id_pago}
              className="grid items-center gap-3 px-4 py-3 border-b border-[color:var(--color-rule)]/50 last:border-0 hover:bg-[color:var(--color-surface-2)]/40 transition-colors"
              style={{
                gridTemplateColumns: "auto 1fr auto auto",
              }}
            >
              <div className="mono text-xs text-[color:var(--color-ink-soft)] w-[110px] truncate">
                {p.id_pago}
              </div>
              <div className="min-w-0">
                <div className="text-sm text-[color:var(--color-ink)] truncate">
                  {p.nombre ?? (
                    <span className="italic text-[color:var(--color-faint)]">sin nombre</span>
                  )}
                </div>
                <div className="text-[11px] text-[color:var(--color-muted)] mt-0.5 mono truncate">
                  {p.curso ?? "—"} <span className="text-[color:var(--color-faint)]">·</span>{" "}
                  {formatDate(p.fecha)}
                </div>
              </div>
              <span
                className={clsx(
                  "inline-block px-2.5 py-0.5 rounded-md text-[11px] mono border",
                  ESTADO_STYLES[p.estado],
                )}
              >
                {p.estado}
              </span>
              <div className="mono tabular-nums text-sm text-[color:var(--color-ink)] font-medium text-right whitespace-nowrap">
                {formatMoney(p.importe, p.moneda)}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-1 px-4 py-3 border-t border-[color:var(--color-rule)] text-xs text-[color:var(--color-muted)] mono">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="p-1.5 rounded-md hover:bg-[color:var(--color-surface-2)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="px-2">
            {safePage + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="p-1.5 rounded-md hover:bg-[color:var(--color-surface-2)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Página siguiente"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

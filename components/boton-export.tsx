"use client";

import { Download } from "lucide-react";
import { pagosToCsv, downloadCsv } from "@/lib/csv";
import type { Pago } from "@/lib/types";

export function BotonExport({ pagos }: { pagos: Pago[] }) {
  const handleClick = () => {
    if (pagos.length === 0) return;
    const csv = pagosToCsv(pagos);
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadCsv(`pagos-formapro-${ts}.csv`, csv);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pagos.length === 0}
      className="flex items-center gap-2 px-4 py-2.5 text-xs rounded-xl border border-[color:var(--color-rule)] bg-[color:var(--color-surface)] text-[color:var(--color-ink)] hover:border-[color:var(--color-accent)]/60 hover:text-[color:var(--color-accent-strong)] hover:bg-[color:var(--color-accent-soft)]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mono shadow-sm"
    >
      <Download size={13} />
      Export CSV
      <span className="text-[color:var(--color-muted)]">
        ({pagos.length})
      </span>
    </button>
  );
}

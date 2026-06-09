"use client";

import clsx from "clsx";
import { Search, X } from "lucide-react";
import type { FiltrosState } from "@/lib/types";

type Props = {
  state: FiltrosState;
  setState: (s: FiltrosState) => void;
  monedasDisponibles: string[];
};

const ESTADOS: Array<{ key: FiltrosState["estado"]; label: string }> = [
  { key: "todos", label: "Todos" },
  { key: "completed", label: "Completed" },
  { key: "refunded", label: "Refunded" },
  { key: "failed", label: "Failed" },
];

export function Filtros({ state, setState, monedasDisponibles }: Props) {
  const limpiar = () =>
    setState({
      estado: "todos",
      moneda: "todas",
      desde: null,
      hasta: null,
      busqueda: "",
    });

  const activos =
    state.estado !== "todos" ||
    state.moneda !== "todas" ||
    state.desde !== null ||
    state.hasta !== null ||
    state.busqueda.trim() !== "";

  return (
    <div className="card p-3 flex flex-wrap items-center gap-2 sticky top-3 z-10 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--color-surface)]/85">
      {/* estado chips */}
      <div className="flex gap-1 p-1 rounded-xl bg-[color:var(--color-surface-2)] border border-[color:var(--color-rule)]">
        {ESTADOS.map((e) => (
          <button
            key={e.key}
            type="button"
            onClick={() => setState({ ...state, estado: e.key })}
            className={clsx(
              "px-3 py-1.5 text-xs rounded-lg transition-colors mono",
              state.estado === e.key
                ? "bg-[color:var(--color-surface)] text-[color:var(--color-ink)] shadow-sm"
                : "text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]",
            )}
          >
            {e.label}
          </button>
        ))}
      </div>

      {/* moneda */}
      <select
        value={state.moneda}
        onChange={(e) =>
          setState({ ...state, moneda: e.target.value as FiltrosState["moneda"] })
        }
        className="bg-[color:var(--color-surface)] border border-[color:var(--color-rule)] rounded-xl px-3 py-2 text-xs mono text-[color:var(--color-ink)] focus:outline-none focus:border-[color:var(--color-accent)]/60"
      >
        <option value="todas">Todas las monedas</option>
        {monedasDisponibles.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      {/* fechas */}
      <input
        type="date"
        value={state.desde ?? ""}
        onChange={(e) => setState({ ...state, desde: e.target.value || null })}
        className="bg-[color:var(--color-surface)] border border-[color:var(--color-rule)] rounded-xl px-3 py-2 text-xs mono text-[color:var(--color-ink)] focus:outline-none focus:border-[color:var(--color-accent)]/60"
        aria-label="Desde"
      />
      <span className="text-[color:var(--color-muted)] text-xs">→</span>
      <input
        type="date"
        value={state.hasta ?? ""}
        onChange={(e) => setState({ ...state, hasta: e.target.value || null })}
        className="bg-[color:var(--color-surface)] border border-[color:var(--color-rule)] rounded-xl px-3 py-2 text-xs mono text-[color:var(--color-ink)] focus:outline-none focus:border-[color:var(--color-accent)]/60"
        aria-label="Hasta"
      />

      {/* búsqueda */}
      <div className="relative ml-auto min-w-[240px] flex-1 md:flex-initial md:min-w-[280px]">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]"
          size={14}
        />
        <input
          type="text"
          value={state.busqueda}
          onChange={(e) => setState({ ...state, busqueda: e.target.value })}
          placeholder="Buscar por id, nombre, email o curso..."
          className="w-full bg-[color:var(--color-surface)] border border-[color:var(--color-rule)] rounded-xl pl-9 pr-3 py-2 text-xs text-[color:var(--color-ink)] placeholder:text-[color:var(--color-muted)] focus:outline-none focus:border-[color:var(--color-accent)]/60"
        />
      </div>

      {activos && (
        <button
          type="button"
          onClick={limpiar}
          className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl border border-[color:var(--color-rule)] text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] hover:border-[color:var(--color-rule-2)] transition-colors"
        >
          <X size={12} /> Limpiar
        </button>
      )}
    </div>
  );
}

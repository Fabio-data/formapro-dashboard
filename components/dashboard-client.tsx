"use client";

import { useMemo, useState } from "react";
import { KpiCard } from "./kpi-card";
import { ChartIngresos } from "./chart-ingresos";
import { CursosList } from "./cursos-list";
import { PagosList } from "./pagos-list";
import { Filtros } from "./filtros";
import { BotonExport } from "./boton-export";
import { ThemeToggle } from "./theme-toggle";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Pago, FiltrosState } from "@/lib/types";

const INIT_FILTROS: FiltrosState = {
  estado: "todos",
  moneda: "todas",
  desde: null,
  hasta: null,
  busqueda: "",
};

export function DashboardClient({ pagos }: { pagos: Pago[] }) {
  const [filtros, setFiltros] = useState<FiltrosState>(INIT_FILTROS);

  const monedasDisponibles = useMemo(() => {
    const s = new Set<string>();
    for (const p of pagos) s.add(p.moneda);
    return [...s].sort();
  }, [pagos]);

  const filtrados = useMemo(() => {
    const q = filtros.busqueda.trim().toLowerCase();
    return pagos.filter((p) => {
      if (filtros.estado !== "todos" && p.estado !== filtros.estado) return false;
      if (filtros.moneda !== "todas" && p.moneda !== filtros.moneda) return false;
      if (filtros.desde && p.fecha.slice(0, 10) < filtros.desde) return false;
      if (filtros.hasta && p.fecha.slice(0, 10) > filtros.hasta) return false;
      if (q) {
        const hay =
          p.id_pago.toLowerCase().includes(q) ||
          (p.nombre?.toLowerCase().includes(q) ?? false) ||
          (p.email?.toLowerCase().includes(q) ?? false) ||
          (p.curso?.toLowerCase().includes(q) ?? false);
        if (!hay) return false;
      }
      return true;
    });
  }, [pagos, filtros]);

  const completed = filtrados.filter((p) => p.estado === "completed");
  const refunded = filtrados.filter((p) => p.estado === "refunded");

  // Ingresos por moneda (no sumamos peras con manzanas)
  const ingresosPorMonedaMap = new Map<string, number>();
  for (const p of completed) {
    ingresosPorMonedaMap.set(
      p.moneda,
      (ingresosPorMonedaMap.get(p.moneda) ?? 0) + p.importe,
    );
  }
  const ingresosOrdenados = [...ingresosPorMonedaMap.entries()].sort(
    (a, b) => b[1] - a[1],
  );
  const monedaDominante = ingresosOrdenados[0]?.[0];

  let ticketMedio: { valor: number; moneda: string } | null = null;
  if (monedaDominante) {
    const ofMon = completed.filter((p) => p.moneda === monedaDominante);
    if (ofMon.length > 0) {
      ticketMedio = {
        valor: ofMon.reduce((a, p) => a + p.importe, 0) / ofMon.length,
        moneda: monedaDominante,
      };
    }
  }

  const refundsPct = filtrados.length > 0
    ? (refunded.length / filtrados.length) * 100
    : 0;

  return (
    <main className="max-w-[1240px] mx-auto px-5 md:px-8 py-6 md:py-10 w-full">
      {/* HERO BAND */}
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6">
        <div>
          <div className="label-eyebrow mb-2 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[color:var(--color-accent)] animate-pulse" />
            FormaPro Academy · Pagos
          </div>
          <h1 className="text-3xl md:text-[34px] font-medium tracking-tight text-[color:var(--color-ink)]">
            Dashboard de pagos
          </h1>
          <p className="text-sm text-[color:var(--color-ink-soft)] mt-1.5">
            Lectura directa de la tabla{" "}
            <span className="mono text-[color:var(--color-ink)]">pagos</span> en Supabase
            {" · "}
            <span className="mono">{pagos.length}</span> pagos cargados
            {filtrados.length !== pagos.length && (
              <>
                {" · "}
                <span className="mono text-[color:var(--color-accent-strong)]">
                  {filtrados.length}
                </span>{" "}
                tras filtros
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BotonExport pagos={filtrados} />
          <ThemeToggle />
        </div>
      </header>

      {/* FILTROS sticky */}
      <div className="mb-5">
        <Filtros
          state={filtros}
          setState={setFiltros}
          monedasDisponibles={monedasDisponibles}
        />
      </div>

      {/* KPIs · 4 columnas iguales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard
          emphasis="primary"
          label={`Ingresos completed · ${monedaDominante ?? "—"}`}
          value={
            ingresosOrdenados.length === 0
              ? "—"
              : formatMoney(ingresosOrdenados[0][1], ingresosOrdenados[0][0])
          }
          delta={
            completed.length > 0
              ? { kind: "up", text: `${completed.length} pago${completed.length === 1 ? "" : "s"}` }
              : { kind: "flat", text: "sin completed" }
          }
        />
        <KpiCard
          label="Pagos totales"
          value={formatNumber(filtrados.length)}
          hint={
            <>
              <span className="mono text-[color:var(--color-accent-strong)]">
                {completed.length}
              </span>{" "}
              completed
            </>
          }
        />
        <KpiCard
          label="Ticket medio"
          value={
            ticketMedio
              ? formatMoney(ticketMedio.valor, ticketMedio.moneda)
              : "—"
          }
          hint={
            ticketMedio
              ? `media en ${ticketMedio.moneda}`
              : "sin completed"
          }
        />
        <KpiCard
          emphasis={refunded.length > 0 ? "warn" : "default"}
          label="Refunds"
          value={formatNumber(refunded.length)}
          delta={
            refunded.length > 0
              ? { kind: "down", text: `${refundsPct.toFixed(1)}%` }
              : { kind: "flat", text: "ninguno" }
          }
        />
      </div>

      {/* MAIN GRID · chart + cursos */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 mb-5">
        <ChartIngresos pagos={filtrados} />
        <CursosList pagos={filtrados} />
      </div>

      {/* PAGOS RECIENTES */}
      <PagosList pagos={filtrados} />

      <footer className="mt-10 pt-5 border-t border-[color:var(--color-rule)] text-xs text-[color:var(--color-muted)] mono flex flex-wrap gap-4 justify-between">
        <span>FormaPro Academy · Prueba 2 · Logali Group</span>
        <span>Next.js · Supabase anon key · Vercel</span>
      </footer>
    </main>
  );
}

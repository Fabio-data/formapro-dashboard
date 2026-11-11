import type { KpiData, Pago } from "./types";

/**
 * KPIs del subset de pagos visible. Los ingresos se agrupan por moneda y nunca
 * se suman entre monedas distintas: la primera entrada de `ingresosPorMoneda`
 * es la moneda dominante y el ticket medio se calcula solo sobre ella.
 */
export function calcularKpis(pagos: Pago[]): KpiData {
  const porMoneda = new Map<string, { total: number; pagos: number }>();
  let totalCompleted = 0;
  let totalRefunds = 0;

  for (const p of pagos) {
    if (p.estado === "refunded") totalRefunds++;
    if (p.estado !== "completed") continue;
    totalCompleted++;
    const acc = porMoneda.get(p.moneda) ?? { total: 0, pagos: 0 };
    acc.total += p.importe;
    acc.pagos++;
    porMoneda.set(p.moneda, acc);
  }

  const ordenadas = [...porMoneda.entries()].sort(
    (a, b) => b[1].total - a[1].total,
  );
  const dominante = ordenadas[0];

  return {
    ingresosPorMoneda: ordenadas.map(([moneda, { total }]) => ({ moneda, total })),
    totalPagos: pagos.length,
    totalCompleted,
    totalRefunds,
    refundsPct: pagos.length > 0 ? (totalRefunds / pagos.length) * 100 : 0,
    ticketMedio: dominante
      ? { moneda: dominante[0], valor: dominante[1].total / dominante[1].pagos }
      : null,
  };
}

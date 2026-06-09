"use client";

import { useEffect, useRef, useState } from "react";
import { formatDateShort, formatMoney, formatNumber } from "@/lib/format";
import type { Pago } from "@/lib/types";

type Punto = { fecha: string; total: number; n: number };

function agruparPorDia(pagos: Pago[]): { puntos: Punto[]; moneda: string } {
  if (pagos.length === 0) return { puntos: [], moneda: "USD" };
  const conteo = new Map<string, number>();
  for (const p of pagos) {
    if (p.estado !== "completed") continue;
    conteo.set(p.moneda, (conteo.get(p.moneda) ?? 0) + 1);
  }
  const moneda = [...conteo.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "USD";

  const buckets = new Map<string, Punto>();
  for (const p of pagos) {
    if (p.estado !== "completed" || p.moneda !== moneda) continue;
    const dia = p.fecha.slice(0, 10);
    const cur = buckets.get(dia) ?? { fecha: dia, total: 0, n: 0 };
    cur.total += p.importe;
    cur.n += 1;
    buckets.set(dia, cur);
  }
  return {
    puntos: [...buckets.values()].sort((a, b) => (a.fecha < b.fecha ? -1 : 1)),
    moneda,
  };
}

function smoothPath(points: number[][]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`;
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i - 1];
    const [x2, y2] = points[i];
    const cx = (x1 + x2) / 2;
    d += ` C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
  }
  return d;
}

export function ChartIngresos({ pagos }: { pagos: Pago[] }) {
  const { puntos, moneda } = agruparPorDia(pagos);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(el.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (puntos.length === 0) {
    return (
      <div className="card p-6 h-[320px] flex items-center justify-center text-[color:var(--color-muted)] text-sm">
        Sin pagos completados que graficar con los filtros actuales.
      </div>
    );
  }

  const H = 240;
  const padX = 40;
  const padY = 30;
  const innerW = Math.max(100, width - padX * 2);
  const innerH = H - padY * 2;

  const max = Math.max(...puntos.map((p) => p.total));
  const points: number[][] = puntos.map((p, i) => {
    const x = puntos.length === 1
      ? padX + innerW / 2
      : padX + (i / (puntos.length - 1)) * innerW;
    const y = padY + innerH - (p.total / Math.max(1, max)) * innerH;
    return [x, y];
  });
  const linePath = smoothPath(points);
  const areaPath = linePath
    ? `${linePath} L${points[points.length - 1][0]},${padY + innerH} L${points[0][0]},${padY + innerH} Z`
    : "";

  const gridY = [0.25, 0.5, 0.75, 1].map((f) => padY + innerH * f);
  const hoverPoint = hover != null ? points[hover] : null;
  const hoverData = hover != null ? puntos[hover] : null;

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="label-eyebrow mb-1">Ingresos en el tiempo</div>
          <div className="text-sm text-[color:var(--color-ink-soft)]">
            Pagos <span className="mono text-[color:var(--color-ink)]">completed</span> en{" "}
            <span className="mono text-[color:var(--color-ink)]">{moneda}</span>
            {" · "}
            <span className="mono text-[color:var(--color-ink)]">{puntos.length}</span>{" "}
            {puntos.length === 1 ? "día" : "días"}
          </div>
        </div>
      </div>

      <div ref={containerRef} style={{ width: "100%" }}>
        <svg
          className="line-chart block"
          viewBox={`0 0 ${width} ${H}`}
          width="100%"
          height={H}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * width;
            // find nearest point
            let nearest = 0;
            let best = Infinity;
            points.forEach(([px], i) => {
              const d = Math.abs(px - x);
              if (d < best) { best = d; nearest = i; }
            });
            setHover(nearest);
          }}
        >
          {/* horizontal grid lines */}
          {gridY.map((y, i) => (
            <line key={i} className="grid-l" x1={padX} y1={y} x2={width - padX} y2={y} />
          ))}

          {/* area + line */}
          {areaPath && <path className="area" d={areaPath} />}
          {linePath && <path className="l" d={linePath} />}

          {/* dots */}
          {points.map(([x, y], i) => (
            <circle key={i} className="dot" cx={x} cy={y} r={hover === i ? 5 : 3.5} />
          ))}

          {/* x-axis labels */}
          {puntos.map((p, i) => {
            if (puntos.length > 8 && i % 2 !== 0 && i !== puntos.length - 1) return null;
            const x = puntos.length === 1
              ? padX + innerW / 2
              : padX + (i / (puntos.length - 1)) * innerW;
            return (
              <text
                key={i}
                className="axis-tick"
                x={x}
                y={H - 8}
                textAnchor="middle"
              >
                {formatDateShort(p.fecha + "T00:00:00")}
              </text>
            );
          })}

          {/* hover line + tooltip */}
          {hoverPoint && hoverData && (
            <>
              <line
                x1={hoverPoint[0]}
                y1={padY}
                x2={hoverPoint[0]}
                y2={padY + innerH}
                stroke="var(--color-rule-2)"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            </>
          )}
        </svg>
      </div>

      {hoverData && (
        <div className="mt-2 text-xs text-[color:var(--color-ink-soft)] flex gap-3 mono justify-end">
          <span className="text-[color:var(--color-muted)]">
            {formatDateShort(hoverData.fecha + "T00:00:00")}
          </span>
          <span className="text-[color:var(--color-accent-strong)] font-medium">
            {formatMoney(hoverData.total, moneda)}
          </span>
          <span className="text-[color:var(--color-muted)]">
            {formatNumber(hoverData.n)} pago{hoverData.n === 1 ? "" : "s"}
          </span>
        </div>
      )}
    </div>
  );
}

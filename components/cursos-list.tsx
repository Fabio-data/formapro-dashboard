import type { Pago } from "@/lib/types";
import { formatNumber } from "@/lib/format";

type Curso = { curso: string; n: number };

function topCursos(pagos: Pago[], n = 5): Curso[] {
  const map = new Map<string, number>();
  for (const p of pagos) {
    if (!p.curso) continue;
    map.set(p.curso, (map.get(p.curso) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([curso, count]) => ({ curso, n: count }))
    .sort((a, b) => b.n - a.n)
    .slice(0, n);
}

export function CursosList({ pagos }: { pagos: Pago[] }) {
  const cursos = topCursos(pagos);
  const max = cursos[0]?.n ?? 1;

  return (
    <div className="card p-6">
      <div className="label-eyebrow mb-4">Cursos más populares</div>
      {cursos.length === 0 ? (
        <div className="text-sm text-[color:var(--color-muted)] py-6">
          Sin cursos en el dataset filtrado.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {cursos.map((c, i) => (
            <div
              key={c.curso}
              className="flex items-center gap-3 py-2 border-b border-[color:var(--color-rule)]/50 last:border-0"
            >
              <div className="flex-none w-8 h-8 rounded-full bg-[color:var(--color-surface-2)] border border-[color:var(--color-rule)] grid place-items-center text-xs mono text-[color:var(--color-muted)]">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[color:var(--color-ink)] truncate">
                  {c.curso}
                </div>
                <div className="meter mt-1.5">
                  <span style={{ width: `${(c.n / max) * 100}%` }}></span>
                </div>
              </div>
              <div className="mono tabular-nums text-sm text-[color:var(--color-ink-soft)] flex-none w-8 text-right">
                {formatNumber(c.n)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { RefreshCw } from "lucide-react";

/**
 * Refresca los datos del Server Component (page.tsx es force-dynamic) en un
 * intervalo, para que un pago nuevo aparezca solo sin recargar a mano. Solo
 * refresca cuando la pestaña está visible, para no martillar Supabase en
 * segundo plano. Se puede pausar.
 */
export function LiveRefresh({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [live, setLive] = useState(true);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      router.refresh();
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 500);
      return () => clearTimeout(t);
    }, intervalMs);
    return () => clearInterval(id);
  }, [live, intervalMs, router]);

  const manual = () => {
    router.refresh();
    setFlash(true);
    setTimeout(() => setFlash(false), 500);
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setLive((v) => !v)}
        title={live ? "Pausar actualización en vivo" : "Reanudar"}
        className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl border border-[color:var(--color-rule)] bg-[color:var(--color-surface)] text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)] transition-colors mono"
      >
        <span
          className={clsx(
            "inline-block w-1.5 h-1.5 rounded-full transition-colors",
            live
              ? "bg-[color:var(--color-accent)] animate-pulse"
              : "bg-[color:var(--color-faint)]",
            flash && "ring-2 ring-[color:var(--color-accent)]/40",
          )}
        />
        {live ? "En vivo" : "Pausado"}
      </button>
      <button
        type="button"
        onClick={manual}
        title="Actualizar ahora"
        aria-label="Actualizar ahora"
        className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-[color:var(--color-rule)] bg-[color:var(--color-surface)] text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)] hover:border-[color:var(--color-rule-2)] transition-colors"
      >
        <RefreshCw size={15} className={clsx(flash && "animate-spin")} />
      </button>
    </div>
  );
}

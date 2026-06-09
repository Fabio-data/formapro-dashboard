import { supabase } from "@/lib/supabase";
import { DashboardClient } from "@/components/dashboard-client";
import type { Pago } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getPagos(): Promise<{ pagos: Pago[]; error: string | null }> {
  const { data, error } = await supabase
    .from("pagos")
    .select("id_pago, email, nombre, curso, importe, moneda, estado, fecha")
    .order("fecha", { ascending: false })
    .limit(1000);

  if (error) return { pagos: [], error: error.message };
  return { pagos: (data ?? []) as Pago[], error: null };
}

export default async function Home() {
  const { pagos, error } = await getPagos();

  if (error) {
    return (
      <main className="max-w-[900px] mx-auto px-5 py-12">
        <div className="card p-6 border-[color:var(--color-danger)]/40">
          <div className="label-eyebrow mb-2 text-[color:var(--color-danger)]">
            No se pudo leer Supabase
          </div>
          <p className="text-sm text-[color:var(--color-ink)] mb-3">
            La query a la tabla{" "}
            <span className="mono">pagos</span> falló. Revisa que la anon key y
            la URL estén bien en las variables de entorno, y que la tabla tenga
            políticas de RLS que permitan SELECT con la anon key.
          </p>
          <pre className="mono text-xs text-[color:var(--color-muted)] whitespace-pre-wrap">
            {error}
          </pre>
        </div>
      </main>
    );
  }

  return <DashboardClient pagos={pagos} />;
}

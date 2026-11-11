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

  if (error) {
    // El detalle queda en los logs del servidor; al visitante no se le
    // muestran mensajes internos de la base de datos.
    console.error("Supabase:", error.message);
    return { pagos: [], error: "No se pudieron cargar los pagos." };
  }
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
          <p className="text-sm text-[color:var(--color-ink)]">
            {error} Inténtalo de nuevo en unos minutos.
          </p>
        </div>
      </main>
    );
  }

  return <DashboardClient pagos={pagos} />;
}

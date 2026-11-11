import "server-only";
import { createClient } from "@supabase/supabase-js";

// Solo servidor: `server-only` rompe el build si un componente cliente importa
// este módulo, así que ni la URL ni la key llegan al bundle del navegador.
// Se aceptan los nombres NEXT_PUBLIC_* antiguos para no romper despliegues
// existentes; los nombres sin prefijo son los recomendados.
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Faltan SUPABASE_URL y/o SUPABASE_ANON_KEY. " +
      "Definirlas en .env.local (local) y en Project Settings de Vercel (producción).",
  );
}

// Defensa contra typos en envs: la URL debe ser https y de supabase.co.
let hostname: string;
try {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new TypeError("no https");
  hostname = parsed.hostname;
} catch {
  throw new Error("SUPABASE_URL no es una URL https válida.");
}
if (!/\.supabase\.co$/i.test(hostname)) {
  throw new Error(`SUPABASE_URL no apunta a *.supabase.co (recibido: ${hostname})`);
}

// Cliente con anon key: el acceso real lo gobiernan las policies RLS de la
// tabla pagos. La service_role key nunca debe aparecer en este repo.
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

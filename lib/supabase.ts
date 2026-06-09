import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Definirlas en .env.local (local) y en Project Settings de Vercel (producción).",
  );
}

// Defensa contra typos en envs: la URL debe ser de supabase.co.
// Si alguien pega aquí un dominio raro, falla rápido en build/start
// en vez de hablar con un servidor extraño.
try {
  const parsed = new URL(url);
  if (!/\.supabase\.co$/i.test(parsed.hostname)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL no apunta a *.supabase.co (recibido: ${parsed.hostname})`,
    );
  }
} catch (e) {
  if (e instanceof TypeError) {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL no es una URL válida: ${url}`);
  }
  throw e;
}

// Cliente público con anon key. La seguridad real vive en las policies RLS
// de la tabla pagos. En este repo NUNCA debe aparecer la service_role key:
//   - no la importes desde process.env aquí
//   - no la prefijes con NEXT_PUBLIC_ (la expondría al bundle del cliente)
//   - si en el futuro hace falta acceso privilegiado, crea un cliente aparte
//     dentro de una server action o route handler, leyendo SUPABASE_SERVICE_ROLE_KEY
//     sin prefijo público.
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

/**
 * Formato dinámico de divisa basado en el código ISO 4217 que viene en la fila.
 * Nunca se hardcodea la moneda. Si el código es desconocido, cae al locale es-CO
 * y muestra el código junto al número.
 */
const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(moneda: string): Intl.NumberFormat {
  const key = moneda.toUpperCase();
  let f = formatterCache.get(key);
  if (f) return f;
  try {
    f = new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: key,
      // Fijar fraction digits explícitamente. Sin esto, el server (Node ICU)
      // y el cliente (Chrome ICU) divergen — p.ej. COP el server muestra ",00"
      // y el cliente lo omite, rompiendo la hidratación.
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    f = new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  formatterCache.set(key, f);
  return f;
}

// Normaliza espacios especiales que ICU mete (U+202F narrow no-break y
// U+00A0 no-break) → espacio normal. Sin esto, server y cliente divergen.
const cleanSpaces = (s: string) =>
  s.replace(/ /g, " ").replace(/ /g, " ");

export function formatMoney(valor: number, moneda: string): string {
  const code = moneda.toUpperCase();
  const out = cleanSpaces(getFormatter(moneda).format(valor));

  // 1. Si Intl ya muestra el código ISO (EUR, JPY, COP raros...), no duplicar.
  if (out.includes(code)) return out;

  // 2. Si usa un símbolo que YA identifica la moneda (US$, CA$, €, £, ¥...),
  //    tampoco anexamos el código: sería redundante ("US$ 1.500 USD").
  const tieneSimboloEspecifico = /[A-Za-z]\$|[€£¥₩₹]/.test(out);
  if (tieneSimboloEspecifico) return out;

  // 3. Resto: "$" genérico (ambiguo entre COP/USD/MXN...) o fallback sin
  //    símbolo (código ISO inválido) → anexamos el código para desambiguar.
  return `${out} ${code}`;
}

export function formatNumber(n: number): string {
  return cleanSpaces(new Intl.NumberFormat("es-CO").format(n));
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  // 24h con hourCycle h23 evita el separador AM/PM y mantiene
  // el mismo output en server y client.
  const f = new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return cleanSpaces(f.format(d));
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const f = new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "2-digit",
  });
  return cleanSpaces(f.format(d));
}

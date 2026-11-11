import type { Pago } from "./types";

const HEADERS = [
  "id_pago",
  "fecha",
  "nombre",
  "email",
  "curso",
  "importe",
  "moneda",
  "estado",
] as const;

function esc(v: unknown): string {
  if (v == null) return "";
  let s = String(v);
  // Anti inyección de fórmulas: los datos entran por un webhook, así que un
  // texto como "=HYPERLINK(...)" se ejecutaría al abrir el CSV en Excel.
  // Los números (p. ej. importes negativos) no se tocan.
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  // RFC 4180: si tiene coma, comilla o salto, envolver en comillas y duplicar comillas
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function pagosToCsv(pagos: Pago[]): string {
  const rows = [HEADERS.join(",")];
  for (const p of pagos) {
    rows.push(
      [
        esc(p.id_pago),
        esc(p.fecha),
        esc(p.nombre ?? ""),
        esc(p.email ?? ""),
        esc(p.curso ?? ""),
        esc(p.importe),
        esc(p.moneda),
        esc(p.estado),
      ].join(","),
    );
  }
  // BOM UTF-8 para que Excel abra acentos correctamente
  return "﻿" + rows.join("\r\n");
}

export function downloadCsv(filename: string, contenido: string) {
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

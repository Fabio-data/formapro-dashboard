import assert from "node:assert/strict";
import { test } from "node:test";
import { pagosToCsv } from "../lib/csv.ts";
import { formatMoney } from "../lib/format.ts";
import { calcularKpis } from "../lib/kpis.ts";
import type { Pago } from "../lib/types.ts";

const pago = (over: Partial<Pago>): Pago => ({
  id_pago: "PAY-1",
  email: "ana@ejemplo.com",
  nombre: "Ana",
  curso: "Power BI",
  importe: 100,
  moneda: "COP",
  estado: "completed",
  fecha: "2026-06-01T10:00:00Z",
  ...over,
});

test("KPIs: no suma monedas distintas y usa la dominante para el ticket medio", () => {
  const k = calcularKpis([
    pago({ importe: 100_000 }),
    pago({ importe: 200_000 }),
    pago({ importe: 500, moneda: "USD" }),
    pago({ estado: "refunded" }),
    pago({ estado: "failed" }),
  ]);
  assert.deepEqual(k.ingresosPorMoneda, [
    { moneda: "COP", total: 300_000 },
    { moneda: "USD", total: 500 },
  ]);
  assert.deepEqual(k.ticketMedio, { moneda: "COP", valor: 150_000 });
  assert.equal(k.totalPagos, 5);
  assert.equal(k.totalCompleted, 3);
  assert.equal(k.totalRefunds, 1);
  assert.equal(k.refundsPct, 20);
});

test("KPIs: lista vacía no divide por cero", () => {
  const k = calcularKpis([]);
  assert.equal(k.ticketMedio, null);
  assert.equal(k.refundsPct, 0);
});

test("CSV: BOM, CRLF y escape RFC 4180", () => {
  const csv = pagosToCsv([pago({ nombre: 'Pérez, "Ana"' })]);
  assert.ok(csv.startsWith("﻿id_pago,fecha,"));
  assert.ok(csv.includes("\r\n"));
  assert.ok(csv.includes('"Pérez, ""Ana"""'));
});

test("CSV: neutraliza fórmulas pero no importes negativos", () => {
  const csv = pagosToCsv([
    pago({ nombre: "=HYPERLINK(\"http://x\")", curso: "@SUM(A1)", importe: -50 }),
  ]);
  assert.ok(csv.includes(`"'=HYPERLINK(""http://x"")"`));
  assert.ok(csv.includes("'@SUM(A1)"));
  assert.ok(csv.includes(",-50,"));
});

test("formatMoney: anexa el código solo si el símbolo es ambiguo", () => {
  assert.match(formatMoney(120000, "COP"), /^\$ ?120\.000,00 COP$/);
  assert.doesNotMatch(formatMoney(1500, "USD"), /USD$/);
});

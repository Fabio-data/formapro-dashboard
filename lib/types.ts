export type EstadoPago = "completed" | "failed" | "refunded";

export type Pago = {
  id_pago: string;
  email: string | null;
  nombre: string | null;
  curso: string | null;
  importe: number;
  moneda: string;
  estado: EstadoPago;
  fecha: string; // ISO date string
};

export type KpiData = {
  ingresosPorMoneda: { moneda: string; total: number }[];
  totalPagos: number;
  totalRefunds: number;
  ticketMedio: { moneda: string; valor: number } | null;
};

export type FiltrosState = {
  estado: EstadoPago | "todos";
  moneda: string | "todas";
  desde: string | null;
  hasta: string | null;
  busqueda: string;
};

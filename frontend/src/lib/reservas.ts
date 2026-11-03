import type { ReservaResponse } from "@/types/reserva";

/** Corte de la reserva en Argentina (UTC-3), independiente de la zona del navegador. */
export function limiteReserva(fecha: string): number {
  return Date.parse(`${fecha}T09:00:00-03:00`);
}

export function puedeGestionarReserva(
  reserva: Pick<ReservaResponse, "fecha" | "estado">,
  ahora = Date.now(),
): boolean {
  return reserva.estado === "ACTIVA" && ahora < limiteReserva(reserva.fecha);
}

import type { Pagina } from "@/types/api";
import type { AsistenciaConfirmada, ReservaDelDia } from "@/types/reserva";
import { pedirApi } from "./apiClient";

/** Reservas activas de una fecha, con la asistencia si ya fue confirmada. Solo el administrador. */
export function listarAsistencias(fecha: string, page = 0, signal?: AbortSignal): Promise<Pagina<ReservaDelDia>> {
  return pedirApi<Pagina<ReservaDelDia>>(`/api/v1/asistencias?fecha=${fecha}&page=${page}&size=50`, { signal });
}

/** Confirma el retiro de una reserva activa. Solo el administrador. */
export function confirmarAsistencia(id: number): Promise<AsistenciaConfirmada> {
  return pedirApi<AsistenciaConfirmada>(`/api/v1/reservas/${id}/confirmacion-asistencia`, { method: "POST" });
}

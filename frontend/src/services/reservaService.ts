import type { CrearReservaRequest, ModificarReservaRequest, ReservaResponse } from "@/types/reserva";
import type { Pagina } from "@/types/api";
import { pedirApi } from "./apiClient";

/** Crea una reserva para el usuario logueado. */
export function crearReserva(request: CrearReservaRequest): Promise<ReservaResponse> {
  return pedirApi<ReservaResponse>("/api/v1/reservas", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function listarReservas(page = 0, signal?: AbortSignal): Promise<Pagina<ReservaResponse>> {
  return pedirApi<Pagina<ReservaResponse>>(`/api/v1/reservas?page=${page}&size=20`, { signal });
}

export function modificarReserva(id: number, request: ModificarReservaRequest): Promise<ReservaResponse> {
  return pedirApi<ReservaResponse>(`/api/v1/reservas/${id}`, {
    method: "PATCH",
    body: JSON.stringify(request),
  });
}

export function cancelarReserva(id: number): Promise<void> {
  return pedirApi<void>(`/api/v1/reservas/${id}`, { method: "DELETE" });
}

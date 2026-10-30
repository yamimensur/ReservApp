import type { CrearReservaRequest, ReservaResponse } from "@/types/reserva";
import { pedirApi } from "./apiClient";

/** Crea una reserva para el usuario logueado. */
export function crearReserva(request: CrearReservaRequest): Promise<ReservaResponse> {
  return pedirApi<ReservaResponse>("/api/v1/reservas", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

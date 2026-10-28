/** Request de POST /api/v1/reservas. */
export interface CrearReservaRequest {
  menuId: number;
  fecha: string;
  comidaIds: number[];
}

export interface ComidaReserva {
  id: number;
  nombre: string;
  tipo: string;
}

/** Respuesta de POST /api/v1/reservas y GET /api/v1/reservas/{id}. */
export interface ReservaResponse {
  id: number;
  codigo: string;
  usuarioId: number;
  menuId: number;
  fecha: string;
  estado: "ACTIVA" | "CANCELADA";
  creadaEn: string;
  comidas: ComidaReserva[];
  notificacion: "ENVIADA" | "NO_ENVIADA" | null;
}

import type { ComidaMenu } from "./menu";

/** Request de POST /api/v1/reservas. */
export interface CrearReservaRequest {
  menuId: number;
  fecha: string;
  comidaIds: number[];
}

export interface ComidaReserva {
  id: number;
  nombre: string;
  tipo: ComidaMenu["tipo"];
}

export interface ModificarReservaRequest {
  comidaIds: number[];
}

/** Reserva devuelta por el listado, detalle, creación y modificación. */
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

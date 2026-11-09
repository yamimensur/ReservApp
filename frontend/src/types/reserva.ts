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

/** Reserva activa del día, para el administrador. */
export interface ReservaDelDia {
  id: number;
  codigo: string;
  correo: string;
  fecha: string;
  estado: "ACTIVA" | "CANCELADA";
  comidas: ComidaReserva[];
  asistenciaConfirmadaEn: string | null;
}

/** Respuesta de POST /api/v1/reservas/{id}/confirmacion-asistencia. */
export interface AsistenciaConfirmada {
  id: number;
  reservaId: number;
  administradorId: number;
  confirmadaEn: string;
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

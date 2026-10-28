/** Comida dentro de un menú, con la marca de compatibilidad para el usuario logueado. */
export interface ComidaMenu {
  id: number;
  nombre: string;
  tipo: "ENTRADA" | "PLATO_PRINCIPAL" | "POSTRE" | "BEBIDA";
  compatible: boolean;
}

/** Respuesta de GET /api/v1/menus?fecha=. */
export interface MenuResponse {
  id: number;
  fecha: string;
  comidas: ComidaMenu[];
}

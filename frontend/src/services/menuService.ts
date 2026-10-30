import type { MenuResponse } from "@/types/menu";
import { pedirApi } from "./apiClient";

/** Consulta el menú aplicable a una fecha (AAAA-MM-DD). */
export function obtenerMenu(fecha: string, signal?: AbortSignal): Promise<MenuResponse> {
  return pedirApi<MenuResponse>(`/api/v1/menus?fecha=${fecha}`, { signal });
}

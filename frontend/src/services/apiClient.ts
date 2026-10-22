import { EVENTO_SESION_VENCIDA } from "@/lib/sesion";
import type { ApiErrorBody } from "@/types/api";
import { borrarToken, leerToken } from "./tokenStorage";

const API_URL = (import.meta.env.VITE_API_URL?.trim() || "http://localhost:8080").replace(/\/$/, "");

/** Error de la API con el status HTTP y el mensaje que mandó el backend. */
export class ErrorApi extends Error {
  readonly status: number;
  readonly campos: Record<string, string>;

  constructor(status: number, mensaje: string, campos: Record<string, string> = {}) {
    super(mensaje);
    this.name = "ErrorApi";
    this.status = status;
    this.campos = campos;
  }
}

function esApiErrorBody(valor: unknown): valor is ApiErrorBody {
  return typeof valor === "object" && valor !== null && "message" in valor && typeof valor.message === "string";
}

/**
 * Único punto del front que habla con la API.
 * Agrega el token, convierte los errores en ErrorApi y, si el token venció (401), cierra la sesión.
 */
export async function pedirApi<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const headers = new Headers(opciones.headers);
  headers.set("Accept", "application/json");
  if (opciones.body !== undefined) headers.set("Content-Type", "application/json");

  const token = leerToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ErrorApi(0, "No pudimos conectarnos con el servidor. Revisá tu conexión y probá de nuevo.");
  }

if (respuesta.status === 401 && token) {
  borrarToken();
  globalThis.dispatchEvent?.(new Event(EVENTO_SESION_VENCIDA));
}

  if (!respuesta.ok) {
    const cuerpo: unknown = await respuesta.json().catch(() => null);
    if (esApiErrorBody(cuerpo)) throw new ErrorApi(respuesta.status, cuerpo.message, cuerpo.fields ?? {});
    throw new ErrorApi(respuesta.status, "Ocurrió un error inesperado. Probá de nuevo en unos minutos.");
  }

  if (respuesta.status === 204) return undefined as T;
  return (await respuesta.json()) as T;
}
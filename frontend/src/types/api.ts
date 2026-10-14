/** Formato de error que devuelve el backend en todas las respuestas 4xx y 5xx (ADR 0006). */
export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  fields?: Record<string, string> | null;
}
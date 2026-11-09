/** Formato de error que devuelve el backend en todas las respuestas 4xx y 5xx (ADR 0006). */
export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  fields?: Record<string, string> | null;
}

/** Campos de Page de Spring Data que consume la interfaz. */
export interface Pagina<T> {
  content: T[];
  number: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

import type { HealthResponse } from "../types/health";

const apiUrl = (import.meta.env.VITE_API_URL?.trim() || "http://localhost:8080").replace(/\/$/, "");

export async function obtenerEstadoApi(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${apiUrl}/api/v1/health`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`La API respondió con estado ${response.status}`);
  }

  const body: unknown = await response.json();
  if (!esHealthResponse(body)) {
    throw new Error("La API devolvió una respuesta inesperada");
  }

  return body;
}

function esHealthResponse(value: unknown): value is HealthResponse {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return candidate.status === "UP" && typeof candidate.application === "string";
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorApi, pedirApi } from "./apiClient";
import { guardarToken, leerToken } from "./tokenStorage";

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
}

// En Node no existe sessionStorage: usamos uno en memoria para los tests.
function storageEnMemoria(): Storage {
  const datos = new Map<string, string>();
  return {
    get length() { return datos.size; },
    clear: () => datos.clear(),
    getItem: (clave) => datos.get(clave) ?? null,
    key: (indice) => [...datos.keys()][indice] ?? null,
    removeItem: (clave) => { datos.delete(clave); },
    setItem: (clave, valor) => { datos.set(clave, valor); },
  };
}

describe("pedirApi", () => {
  beforeEach(() => vi.stubGlobal("sessionStorage", storageEnMemoria()));
  afterEach(() => vi.unstubAllGlobals());

  it("agrega el token como Bearer cuando hay sesión", async () => {
    guardarToken("token-de-prueba");
    const fetchFalso = vi.fn().mockResolvedValue(respuestaJson({ correo: "empleado@reservapp.demo" }));
    vi.stubGlobal("fetch", fetchFalso);

    await pedirApi("/api/v1/usuarios/me");

    const [, opciones] = fetchFalso.mock.calls[0] as [string, RequestInit];
    expect(new Headers(opciones.headers).get("Authorization")).toBe("Bearer token-de-prueba");
  });

  it("no manda Authorization cuando no hay sesión", async () => {
    const fetchFalso = vi.fn().mockResolvedValue(respuestaJson({ status: "UP" }));
    vi.stubGlobal("fetch", fetchFalso);

    await pedirApi("/api/v1/health");

    const [, opciones] = fetchFalso.mock.calls[0] as [string, RequestInit];
    expect(new Headers(opciones.headers).has("Authorization")).toBe(false);
  });

  it("convierte el error del backend en ErrorApi con su mensaje", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuestaJson({
      timestamp: "2026-10-14T12:00:00Z", status: 403, error: "Forbidden",
      message: "No tenés permiso para esta acción", fields: null,
    }, 403)));

    const error = await pedirApi("/api/v1/asistencias").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ErrorApi);
    expect(error).toMatchObject({ status: 403, message: "No tenés permiso para esta acción" });
  });

  it("borra el token cuando el backend responde 401", async () => {
    guardarToken("token-vencido");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuestaJson({
      timestamp: "2026-10-14T12:00:00Z", status: 401, error: "Unauthorized",
      message: "Necesitás iniciar sesión", fields: null,
    }, 401)));

    await expect(pedirApi("/api/v1/usuarios/me")).rejects.toMatchObject({ status: 401 });
    expect(leerToken()).toBeNull();
  });

  it("informa un error claro cuando no hay conexión", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(pedirApi("/api/v1/health")).rejects.toMatchObject({ status: 0 });
  });
});
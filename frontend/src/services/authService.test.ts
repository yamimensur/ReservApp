import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { iniciarSesion } from "./authService";
import { guardarToken, leerToken } from "./tokenStorage";

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
}

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

const usuario = {
  id: 1, correo: "empleado@reservapp.demo", rol: "EMPLEADO",
  tipoUsuario: "EMPLEADO", restricciones: ["Celíaco"],
};

describe("iniciarSesion", () => {
  beforeEach(() => vi.stubGlobal("sessionStorage", storageEnMemoria()));
  afterEach(() => vi.unstubAllGlobals());

  it("guarda el token y devuelve el perfil del usuario", async () => {
    const fetchFalso = vi.fn()
      .mockResolvedValueOnce(respuestaJson({ token: "jwt-nuevo", tipo: "Bearer", expiraEn: "2026-10-14T13:00:00Z" }))
      .mockResolvedValueOnce(respuestaJson(usuario));
    vi.stubGlobal("fetch", fetchFalso);

    const resultado = await iniciarSesion({ correo: "empleado@reservapp.demo", password: "password" });

    expect(resultado.rol).toBe("EMPLEADO");
    expect(leerToken()).toBe("jwt-nuevo");
    const [, opcionesMe] = fetchFalso.mock.calls[1] as [string, RequestInit];
    expect(new Headers(opcionesMe.headers).get("Authorization")).toBe("Bearer jwt-nuevo");
  });

  it("no manda un token viejo al pedir el login", async () => {
    guardarToken("token-viejo");
    const fetchFalso = vi.fn()
      .mockResolvedValueOnce(respuestaJson({ token: "jwt-nuevo", tipo: "Bearer", expiraEn: "2026-10-14T13:00:00Z" }))
      .mockResolvedValueOnce(respuestaJson(usuario));
    vi.stubGlobal("fetch", fetchFalso);

    await iniciarSesion({ correo: "empleado@reservapp.demo", password: "password" });

    const [, opcionesLogin] = fetchFalso.mock.calls[0] as [string, RequestInit];
    expect(new Headers(opcionesLogin.headers).has("Authorization")).toBe(false);
  });

  it("con credenciales incorrectas rechaza y no guarda nada", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuestaJson({
      timestamp: "2026-10-14T12:00:00Z", status: 401, error: "Unauthorized",
      message: "Correo o contraseña incorrectos", fields: null,
    }, 401)));

    await expect(iniciarSesion({ correo: "empleado@reservapp.demo", password: "mala" }))
      .rejects.toMatchObject({ status: 401, message: "Correo o contraseña incorrectos" });
    expect(leerToken()).toBeNull();
  });
});
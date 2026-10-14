// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSesion } from "@/hooks/useSesion";
import { EVENTO_SESION_VENCIDA } from "@/lib/sesion";
import { guardarToken, leerToken } from "@/services/tokenStorage";
import { SesionProvider } from "./SesionProvider";

const usuario = {
  id: 1, correo: "empleado@reservapp.demo", rol: "EMPLEADO",
  tipoUsuario: "EMPLEADO", restricciones: [],
};

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
}

// Componente mínimo que muestra el estado de la sesión y expone los botones.
function Espia() {
  const { sesion, ingresar, salir } = useSesion();
  return (
    <div>
      <p>{sesion.estado === "autenticado" ? sesion.usuario.correo : sesion.estado}</p>
      <button type="button" onClick={() => void ingresar({ correo: "empleado@reservapp.demo", password: "password" })}>
        ingresar
      </button>
      <button type="button" onClick={salir}>salir</button>
    </div>
  );
}

describe("SesionProvider", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("sin token guardado arranca como anónimo", () => {
    render(<SesionProvider><Espia /></SesionProvider>);
    expect(screen.getByText("anonimo")).toBeDefined();
  });

  it("con un token guardado recupera el usuario al recargar", async () => {
    guardarToken("jwt-guardado");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuestaJson(usuario)));

    render(<SesionProvider><Espia /></SesionProvider>);

    expect(screen.getByText("cargando")).toBeDefined();
    expect(await screen.findByText("empleado@reservapp.demo")).toBeDefined();
  });

  it("ingresar y salir cambian la sesión", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(respuestaJson({ token: "jwt-nuevo", tipo: "Bearer", expiraEn: "2026-10-14T13:00:00Z" }))
      .mockResolvedValueOnce(respuestaJson(usuario)));
    render(<SesionProvider><Espia /></SesionProvider>);

    act(() => screen.getByText("ingresar").click());
    expect(await screen.findByText("empleado@reservapp.demo")).toBeDefined();

    act(() => screen.getByText("salir").click());
    expect(screen.getByText("anonimo")).toBeDefined();
    expect(leerToken()).toBeNull();
  });

  it("si el backend avisa que el token venció, vuelve a anónimo", async () => {
    guardarToken("jwt-guardado");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuestaJson(usuario)));
    render(<SesionProvider><Espia /></SesionProvider>);
    await screen.findByText("empleado@reservapp.demo");

    act(() => { window.dispatchEvent(new Event(EVENTO_SESION_VENCIDA)); });

    expect(screen.getByText("anonimo")).toBeDefined();
  });
});
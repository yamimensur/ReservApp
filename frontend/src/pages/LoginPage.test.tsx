// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SesionProvider } from "@/components/SesionProvider";
import { rutas } from "@/router";

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
}

function abrirLogin() {
  const router = createMemoryRouter(rutas, { initialEntries: ["/ingresar"] });
  render(<SesionProvider><RouterProvider router={router} /></SesionProvider>);
  return router;
}

function completar(correo: string, password: string) {
  fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: correo } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
}

describe("LoginPage", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("con campos vacíos muestra los errores y no llama a la API", () => {
    const fetchFalso = vi.fn();
    vi.stubGlobal("fetch", fetchFalso);
    abrirLogin();

    completar("", "");

    expect(screen.getByText("Ingresá tu correo.")).toBeDefined();
    expect(screen.getByText("Ingresá tu contraseña.")).toBeDefined();
    expect(screen.getByLabelText("Correo electrónico").getAttribute("aria-invalid")).toBe("true");
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("con credenciales incorrectas muestra el mensaje del backend", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuestaJson({
      timestamp: "2026-10-14T12:00:00Z", status: 401, error: "Unauthorized",
      message: "Correo o contraseña incorrectos", fields: null,
    }, 401)));
    abrirLogin();

    completar("empleado@reservapp.demo", "mala");

    expect(await screen.findByText("Correo o contraseña incorrectos")).toBeDefined();
    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("con credenciales correctas entra a la pantalla principal de su rol", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(respuestaJson({ token: "jwt-nuevo", tipo: "Bearer", expiraEn: "2026-10-14T13:00:00Z" }))
      .mockResolvedValueOnce(respuestaJson({
        id: 1, correo: "empleado@reservapp.demo", rol: "EMPLEADO", tipoUsuario: "EMPLEADO", restricciones: [],
      })));
    const router = abrirLogin();

    completar("empleado@reservapp.demo", "password");

    expect(await screen.findByRole("heading", { name: "Menú del día" })).toBeDefined();
    expect(router.state.location.pathname).toBe("/menu");
  });
});

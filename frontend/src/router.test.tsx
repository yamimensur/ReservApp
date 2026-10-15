// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SesionProvider } from "@/components/SesionProvider";
import { rutas } from "@/router";
import { guardarToken } from "@/services/tokenStorage";
import type { Rol } from "@/types/auth";

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
}

function logueadoComo(rol: Rol) {
  guardarToken("jwt-de-prueba");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuestaJson({
    id: 1, correo: "persona@reservapp.demo", rol, tipoUsuario: "EMPLEADO", restricciones: [],
  })));
}

function abrir(ruta: string) {
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] });
  render(<SesionProvider><RouterProvider router={router} /></SesionProvider>);
  return router;
}

describe("rutas", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("sin sesión, una pantalla privada lleva a /ingresar", async () => {
    const router = abrir("/mis-reservas");
    expect(await screen.findByRole("heading", { name: "Ingresar" })).toBeDefined();
    expect(router.state.location.pathname).toBe("/ingresar");
  });

  it("el empleado entra a su pantalla principal según su rol", async () => {
    logueadoComo("EMPLEADO");
    const router = abrir("/");
    expect(await screen.findByRole("heading", { name: "Menú del día" })).toBeDefined();
    expect(router.state.location.pathname).toBe("/menu");
  });

  it("el administrador entra a Reservas del día", async () => {
    logueadoComo("ADMINISTRADOR");
    abrir("/");
    expect(await screen.findByRole("heading", { name: "Reservas del día" })).toBeDefined();
  });

  it("la barra muestra quién soy, mi rol y cómo salgo", async () => {
    logueadoComo("EMPLEADO");
    abrir("/menu");
    expect(await screen.findByText("persona@reservapp.demo")).toBeDefined();
    expect(screen.getByText("Empleado")).toBeDefined();
    expect(screen.getByRole("button", { name: "Salir" })).toBeDefined();
  });

  it("un empleado que abre una pantalla de administrador ve la misma 404", async () => {
    logueadoComo("EMPLEADO");
    abrir("/reservas-del-dia");
    expect(await screen.findByRole("heading", { name: "No encontramos esta página" })).toBeDefined();
  });

  it("una ruta inexistente muestra la 404", async () => {
    logueadoComo("EMPLEADO");
    abrir("/no-existe");
    expect(await screen.findByRole("heading", { name: "No encontramos esta página" })).toBeDefined();
  });

  it("/sistema muestra el catálogo de componentes a cualquier usuario logueado", async () => {
    logueadoComo("ADMINISTRADOR");
    abrir("/sistema");
    expect(await screen.findByRole("heading", { name: "Sistema de diseño" })).toBeDefined();
    expect(screen.getAllByText("✓ Activa").length).toBeGreaterThan(0);
  });

  it("Salir cierra la sesión y vuelve a /ingresar", async () => {
    logueadoComo("EMPLEADO");
    const router = abrir("/menu");
    const salir = await screen.findByRole("button", { name: "Salir" });
    act(() => salir.click());
    expect(await screen.findByRole("heading", { name: "Ingresar" })).toBeDefined();
    expect(router.state.location.pathname).toBe("/ingresar");
    expect(sessionStorage.getItem("reservapp.token")).toBeNull();
  });
});

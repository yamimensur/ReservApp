// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SesionProvider } from "@/components/SesionProvider";
import { guardarToken } from "@/services/tokenStorage";
import { rutas } from "@/router";

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
}

const MENU_RESPONSE = {
  id: 10,
  fecha: "2026-10-28",
  comidas: [
    { id: 1, nombre: "Ensalada César", tipo: "ENTRADA", compatible: true },
    { id: 2, nombre: "Sopa de calabaza", tipo: "ENTRADA", compatible: true },
    { id: 3, nombre: "Milanesa con puré", tipo: "PLATO_PRINCIPAL", compatible: true },
    { id: 4, nombre: "Pollo al curry", tipo: "PLATO_PRINCIPAL", compatible: false },
    { id: 5, nombre: "Flan casero", tipo: "POSTRE", compatible: true },
    { id: 6, nombre: "Agua mineral", tipo: "BEBIDA", compatible: true },
  ],
};

const RESERVA_RESPONSE = {
  id: 42,
  codigo: "ABC-12345",
  usuarioId: 1,
  menuId: 10,
  fecha: "2026-10-28",
  estado: "ACTIVA",
  creadaEn: "2026-10-27T15:00:00Z",
  comidas: [
    { id: 3, nombre: "Milanesa con puré", tipo: "PLATO_PRINCIPAL" },
  ],
  notificacion: "ENVIADA",
};

const USUARIO = {
  id: 1,
  correo: "empleado@reservapp.demo",
  rol: "EMPLEADO",
  tipoUsuario: "EMPLEADO",
  restricciones: [],
};

function setupSesionYMenu(fetchMock: ReturnType<typeof vi.fn>) {
  // guardar token para que la sesión sea "autenticada"
  guardarToken("jwt-test");
  // fetch: 1) GET /usuarios/me (sesión), 2) GET /menus?fecha= (menú)
  fetchMock
    .mockResolvedValueOnce(respuestaJson(USUARIO))
    .mockResolvedValueOnce(respuestaJson(MENU_RESPONSE));
}

function abrirMenu() {
  const router = createMemoryRouter(rutas, { initialEntries: ["/menu"] });
  render(<SesionProvider><RouterProvider router={router} /></SesionProvider>);
  return router;
}

describe("MenuPage", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("muestra el menú agrupado por tipo", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    setupSesionYMenu(fetchMock);

    abrirMenu();

    expect(await screen.findByText("Ensalada César")).toBeDefined();
    expect(screen.getByText("Milanesa con puré")).toBeDefined();
    expect(screen.getByText("Flan casero")).toBeDefined();
    expect(screen.getByText("Agua mineral")).toBeDefined();
  });

  it("marca las comidas incompatibles con badge", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    setupSesionYMenu(fetchMock);

    abrirMenu();

    expect(await screen.findByText("Pollo al curry")).toBeDefined();
    expect(screen.getByText("Incompatible")).toBeDefined();
  });

  it("pre-selecciona el primer plato principal compatible", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    setupSesionYMenu(fetchMock);

    abrirMenu();

    await screen.findByText("Milanesa con puré");
    // el botón del plato principal compatible tiene aria-pressed="true"
    const botonMilanesa = screen.getByText("Milanesa con puré").closest("button");
    expect(botonMilanesa?.getAttribute("aria-pressed")).toBe("true");
  });

  it("muestra estado vacío cuando no hay menú para la fecha", async () => {
    guardarToken("jwt-test");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(respuestaJson(USUARIO))
      .mockResolvedValueOnce(respuestaJson({
        timestamp: "2026-10-28T00:00:00Z", status: 404, error: "Not Found",
        message: "No se encontró un menú para la fecha indicada", fields: null,
      }, 404));
    vi.stubGlobal("fetch", fetchMock);

    abrirMenu();

    expect(await screen.findByText("No hay un menú publicado para esta fecha.")).toBeDefined();
    expect(screen.getByText("Probá seleccionando otro día.")).toBeDefined();
  });

  it("crea la reserva y muestra el código de confirmación", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    setupSesionYMenu(fetchMock);
    // 3) POST /reservas → éxito
    fetchMock.mockResolvedValueOnce(respuestaJson(RESERVA_RESPONSE, 201));

    abrirMenu();

    await screen.findByText("Milanesa con puré");
    fireEvent.click(screen.getByRole("button", { name: "Reservar almuerzo" }));

    expect(await screen.findByText("¡Reserva confirmada!")).toBeDefined();
    expect(screen.getByText(/ABC-12345/)).toBeDefined();
    expect(screen.getByText("Te enviamos un comprobante por correo.")).toBeDefined();
  });

  it("muestra aviso cuando la notificación no fue enviada", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    setupSesionYMenu(fetchMock);
    fetchMock.mockResolvedValueOnce(respuestaJson({
      ...RESERVA_RESPONSE,
      notificacion: "NO_ENVIADA",
    }, 201));

    abrirMenu();

    await screen.findByText("Milanesa con puré");
    fireEvent.click(screen.getByRole("button", { name: "Reservar almuerzo" }));

    expect(await screen.findByText("Reserva registrada")).toBeDefined();
    expect(screen.getByText(/No pudimos enviar el comprobante/)).toBeDefined();
  });

  it("muestra el error del backend cuando la reserva falla (409)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    setupSesionYMenu(fetchMock);
    fetchMock.mockResolvedValueOnce(respuestaJson({
      timestamp: "2026-10-28T00:00:00Z", status: 409, error: "Conflict",
      message: "Ya existe una reserva activa para la fecha indicada", fields: null,
    }, 409));

    abrirMenu();

    await screen.findByText("Milanesa con puré");
    fireEvent.click(screen.getByRole("button", { name: "Reservar almuerzo" }));

    expect(await screen.findByText("Ya existe una reserva activa para la fecha indicada")).toBeDefined();
  });

  it("muestra el error cuando falla la validación (422)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    setupSesionYMenu(fetchMock);
    fetchMock.mockResolvedValueOnce(respuestaJson({
      timestamp: "2026-10-28T00:00:00Z", status: 422, error: "Unprocessable Entity",
      message: "Debe seleccionar exactamente un plato principal", fields: null,
    }, 422));

    abrirMenu();

    await screen.findByText("Milanesa con puré");
    fireEvent.click(screen.getByRole("button", { name: "Reservar almuerzo" }));

    expect(await screen.findByText("Debe seleccionar exactamente un plato principal")).toBeDefined();
  });
});

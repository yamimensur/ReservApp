// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SesionProvider } from "@/components/SesionProvider";
import { MisReservasPage } from "@/pages/MisReservasPage";
import { rutas } from "@/router";
import { guardarToken } from "@/services/tokenStorage";
import type { ReservaResponse } from "@/types/reserva";
import type { Pagina } from "@/types/api";
import type { MenuResponse } from "@/types/menu";

const RESERVA: ReservaResponse = {
  id: 42, codigo: "RES-42", usuarioId: 1, menuId: 10, fecha: "2026-11-03", estado: "ACTIVA",
  creadaEn: "2026-11-02T15:00:00Z", notificacion: null,
  comidas: [
    { id: 1, nombre: "Ensalada", tipo: "ENTRADA" },
    { id: 3, nombre: "Curry de garbanzos", tipo: "PLATO_PRINCIPAL" },
  ],
};
const MENU: MenuResponse = {
  id: 10, fecha: RESERVA.fecha,
  comidas: [
    { id: 1, nombre: "Ensalada", tipo: "ENTRADA", compatible: true },
    { id: 3, nombre: "Curry de garbanzos", tipo: "PLATO_PRINCIPAL", compatible: true },
    { id: 4, nombre: "Tarta de verduras", tipo: "PLATO_PRINCIPAL", compatible: true },
    { id: 5, nombre: "Milanesa", tipo: "PLATO_PRINCIPAL", compatible: false },
  ],
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
function pagina(content: ReservaResponse[] = [RESERVA], numero = 0, totalPages = 1): Pagina<ReservaResponse> {
  return { content, number: numero, totalPages, totalElements: content.length,
    first: numero === 0, last: numero >= totalPages - 1 };
}
function abrir() {
  render(<MemoryRouter><MisReservasPage /></MemoryRouter>);
}

describe("Mis reservas", () => {
  beforeEach(() => {
    sessionStorage.clear();
    guardarToken("token-test");
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-03T11:00:00Z"));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("resuelve la carga y muestra fecha, código, comidas y estado del listado propio", async () => {
    let resolver!: (value: Response) => void;
    const fetchMock = vi.fn().mockReturnValue(new Promise<Response>((resolve) => { resolver = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    abrir();
    expect(screen.getByText("Cargando tus reservas…")).toBeDefined();
    await act(async () => { resolver(json(pagina())); });
    expect(screen.getByRole("heading", { name: /Martes,? 3 de noviembre de 2026/ })).toBeDefined();
    expect(screen.getByText("RES-42")).toBeDefined();
    expect(screen.getByText("Curry de garbanzos")).toBeDefined();
    expect(screen.getByText("✓ Activa")).toBeDefined();
    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/reservas?page=0&size=20");
    expect(new Headers(opciones.headers).get("Authorization")).toBe("Bearer token-test");
  });

  it("ofrece ir al menú cuando no hay reservas", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(pagina([]))));
    abrir();
    expect(await screen.findByText("Todavía no tenés reservas.")).toBeDefined();
    expect(screen.getByRole("link", { name: "Ver menú y reservar" }).getAttribute("href")).toBe("/menu");
  });

  it("informa un fallo de red y permite reintentar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new TypeError("offline")).mockResolvedValueOnce(json(pagina())));
    abrir();
    expect(await screen.findByText(/No pudimos conectarnos con el servidor/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("RES-42")).toBeDefined();
  });

  it("navega entre páginas sin conservar las tarjetas anteriores", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json(pagina([RESERVA], 0, 2)))
      .mockResolvedValueOnce(json(pagina([{ ...RESERVA, id: 43, codigo: "RES-43" }], 1, 2)));
    vi.stubGlobal("fetch", fetchMock);
    abrir();
    await screen.findByText("RES-42");
    expect((screen.getByRole("button", { name: "Anterior" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByText("RES-43")).toBeDefined();
    expect(screen.queryByText("RES-42")).toBeNull();
    expect(fetchMock.mock.calls[1][0]).toContain("page=1&size=20");
    expect((screen.getByRole("button", { name: "Siguiente" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("conserva el historial sin acciones para canceladas o con horario vencido", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(pagina([
      { ...RESERVA, fecha: "2026-11-02" },
      { ...RESERVA, id: 43, estado: "CANCELADA" },
    ]))));
    abrir();
    await screen.findByText("– Cancelada");
    expect(screen.getByText(/Venció el horario para modificar/)).toBeDefined();
    expect(screen.queryByRole("button", { name: "Modificar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Cancelar reserva" })).toBeNull();
  });

  it("precarga elecciones, permite cambiarlas y envía solo comidaIds por PATCH", async () => {
    const actualizada = { ...RESERVA, comidas: [{ id: 4, nombre: "Tarta de verduras", tipo: "PLATO_PRINCIPAL" }] };
    const fetchMock = vi.fn().mockResolvedValueOnce(json(pagina())).mockResolvedValueOnce(json(MENU))
      .mockResolvedValueOnce(json(actualizada));
    vi.stubGlobal("fetch", fetchMock);
    abrir();
    fireEvent.click(await screen.findByRole("button", { name: "Modificar" }));
    const form = screen.getByRole("form", { name: "Modificar reserva" });
    const curry = await within(form).findByRole("button", { name: "Curry de garbanzos" });
    expect(curry.getAttribute("aria-pressed")).toBe("true");
    expect((within(form).getByRole("button", { name: /Milanesa/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(within(form).getByRole("button", { name: "Tarta de verduras" }));
    expect(curry.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(within(form).getByRole("button", { name: "Ensalada" }));
    fireEvent.click(within(form).getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Cambios guardados en tu reserva.")).toBeDefined();
    const [url, opciones] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(url).toContain("/api/v1/reservas/42");
    expect(opciones.method).toBe("PATCH");
    expect(JSON.parse(String(opciones.body))).toEqual({ comidaIds: [4] });
    expect(screen.queryByRole("form")).toBeNull();
    expect(screen.getByText("Tarta de verduras")).toBeDefined();
  });

  it("exige plato principal y conserva elecciones ante un error del servidor", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json(pagina())).mockResolvedValueOnce(json(MENU))
      .mockResolvedValueOnce(json({ message: "La selección contiene una comida incompatible" }, 422)));
    abrir();
    fireEvent.click(await screen.findByRole("button", { name: "Modificar" }));
    const form = screen.getByRole("form", { name: "Modificar reserva" });
    const curry = await within(form).findByRole("button", { name: "Curry de garbanzos" });
    fireEvent.click(curry);
    expect((within(form).getByRole("button", { name: "Guardar cambios" }) as HTMLButtonElement).disabled).toBe(true);
    const tarta = within(form).getByRole("button", { name: "Tarta de verduras" });
    fireEvent.click(tarta);
    fireEvent.click(within(form).getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("La selección contiene una comida incompatible")).toBeDefined();
    expect(tarta.getAttribute("aria-pressed")).toBe("true");
    expect(within(form).getByRole("button", { name: "Ensalada" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("permite reintentar la carga del menú sin modificar la reserva", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json(pagina()))
      .mockResolvedValueOnce(json({ message: "No hay un menú publicado para la fecha indicada" }, 404))
      .mockResolvedValueOnce(json(MENU));
    vi.stubGlobal("fetch", fetchMock);
    abrir();
    fireEvent.click(await screen.findByRole("button", { name: "Modificar" }));
    expect(await screen.findByText("No hay un menú publicado para la fecha indicada")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("button", { name: "Tarta de verduras" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Volver sin guardar" }));
    expect(screen.queryByRole("form")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Modificar" }));
  });

  it.each([404, 409])("conserva la edición ante un error %s del servidor", async (status) => {
    const mensaje = status === 409 ? "Venció el horario de modificación o cancelación" : "No existe la reserva";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json(pagina())).mockResolvedValueOnce(json(MENU))
      .mockResolvedValueOnce(json({ message: mensaje }, status)));
    abrir();
    fireEvent.click(await screen.findByRole("button", { name: "Modificar" }));
    const tarta = await screen.findByRole("button", { name: "Tarta de verduras" });
    fireEvent.click(tarta);
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText(mensaje)).toBeDefined();
    expect(tarta.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("form", { name: "Modificar reserva" })).toBeDefined();
  });

  it("informa si una elección previa ya no es compatible y conserva las válidas", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json(pagina()))
      .mockResolvedValueOnce(json({ ...MENU, comidas: MENU.comidas.map((c) => ({ ...c, compatible: c.id !== 1 && c.compatible })) })));
    abrir();
    fireEvent.click(await screen.findByRole("button", { name: "Modificar" }));
    expect(await screen.findByText(/Algunas comidas ya no están disponibles/)).toBeDefined();
    const form = screen.getByRole("form", { name: "Modificar reserva" });
    expect(within(form).getByRole("button", { name: /Ensalada/ }).getAttribute("aria-pressed")).toBe("false");
    expect(within(form).getByRole("button", { name: "Curry de garbanzos" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("no permite guardar con opciones de otro menú", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json(pagina())).mockResolvedValueOnce(json({ ...MENU, id: 11 })));
    abrir();
    fireEvent.click(await screen.findByRole("button", { name: "Modificar" }));
    expect(await screen.findByText(/El menú de esta reserva cambió/)).toBeDefined();
    expect((screen.getByRole("button", { name: "Guardar cambios" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("pide confirmación, permite desistir y cancela con DELETE 204 conservando el historial", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json(pagina())).mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    abrir();
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar reserva" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Conservar reserva" }));
    fireEvent.click(screen.getByRole("button", { name: "Conservar reserva" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar reserva" }));
    fireEvent.click(screen.getByRole("button", { name: "Sí, cancelar reserva" }));
    expect(await screen.findByText("Reserva cancelada. Se conserva en tu historial.")).toBeDefined();
    expect(screen.getByText("RES-42")).toBeDefined();
    expect(screen.getByText("– Cancelada")).toBeDefined();
    const [url, opciones] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toContain("/api/v1/reservas/42");
    expect(opciones.method).toBe("DELETE");
    expect(opciones.body).toBeUndefined();
    expect(screen.queryByRole("button", { name: "Modificar" })).toBeNull();
  });

  it.each([404, 409])("muestra el error %s de cancelación sin marcarla como cancelada", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json(pagina()))
      .mockResolvedValueOnce(json({ message: status === 409 ? "Venció el horario de modificación o cancelación" : "No existe la reserva" }, status)));
    abrir();
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar reserva" }));
    fireEvent.click(screen.getByRole("button", { name: "Sí, cancelar reserva" }));
    expect(await screen.findByText(status === 409 ? "Venció el horario de modificación o cancelación" : "No existe la reserva")).toBeDefined();
    expect(screen.getByText("✓ Activa")).toBeDefined();
  });

  it("bloquea el doble envío mientras se cancela", async () => {
    let resolver!: (value: Response) => void;
    const fetchMock = vi.fn().mockResolvedValueOnce(json(pagina()))
      .mockReturnValueOnce(new Promise<Response>((resolve) => { resolver = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    abrir();
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar reserva" }));
    fireEvent.click(screen.getByRole("button", { name: "Sí, cancelar reserva" }));
    const boton = screen.getByRole("button", { name: "Cancelando…" });
    expect((boton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(boton);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await act(async () => { resolver(new Response(null, { status: 204 })); });
  });

  it("al llegar a las 09:00 deshabilita una confirmación que estaba abierta", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(pagina())));
    await act(async () => { abrir(); });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar reserva" }));
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-03T12:00:00Z"));
    act(() => { vi.advanceTimersByTime(1000); });
    expect((screen.getByRole("button", { name: "Sí, cancelar reserva" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Venció el horario para modificar/)).toBeDefined();
  });

  it.each(["EMPLEADO", "TERCERIZADO"])("integra la pantalla en la navegación del rol %s", async (rol) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json({
      id: 1, correo: "persona@reservapp.demo", rol, tipoUsuario: rol, restricciones: [],
    })).mockResolvedValueOnce(json(pagina())));
    const router = createMemoryRouter(rutas, { initialEntries: ["/mis-reservas"] });
    render(<SesionProvider><RouterProvider router={router} /></SesionProvider>);
    expect(await screen.findByText("RES-42")).toBeDefined();
    expect(screen.getByRole("link", { name: "Mis reservas" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("heading", { name: "Mis reservas" })).toBeDefined();
  });

  it.each(["ADMINISTRADOR", "RRHH"])("no muestra reservas al rol %s", async (rol) => {
    const fetchMock = vi.fn().mockResolvedValue(json({ id: 1, correo: "persona@reservapp.demo", rol, tipoUsuario: "EMPLEADO", restricciones: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const router = createMemoryRouter(rutas, { initialEntries: ["/mis-reservas"] });
    render(<SesionProvider><RouterProvider router={router} /></SesionProvider>);
    expect(await screen.findByRole("heading", { name: "No encontramos esta página" })).toBeDefined();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });
});

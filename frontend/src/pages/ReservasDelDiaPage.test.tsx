// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReservasDelDiaPage } from "@/pages/ReservasDelDiaPage";
import { guardarToken } from "@/services/tokenStorage";
import { hoyISO } from "@/lib/fecha";
import type { Pagina } from "@/types/api";
import type { ReservaDelDia } from "@/types/reserva";

const RESERVA: ReservaDelDia = {
  id: 7,
  codigo: "abc-7",
  correo: "ana@reservapp.demo",
  fecha: "2026-11-09",
  estado: "ACTIVA",
  comidas: [{ id: 3, nombre: "Curry de garbanzos", tipo: "PLATO_PRINCIPAL" }],
  asistenciaConfirmadaEn: null,
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function pagina(content: ReservaDelDia[]): Pagina<ReservaDelDia> {
  return { content, number: 0, totalPages: content.length ? 1 : 0, totalElements: content.length, first: true, last: true };
}

function abrir() {
  render(<MemoryRouter><ReservasDelDiaPage /></MemoryRouter>);
}

describe("Reservas del día", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("lista las reservas activas de la fecha y ofrece confirmar la asistencia", async () => {
    guardarToken("token-admin");
    const fetchMock = vi.fn().mockResolvedValue(json(pagina([RESERVA])));
    vi.stubGlobal("fetch", fetchMock);
    abrir();

    expect(await screen.findByRole("heading", { name: "ana@reservapp.demo" })).toBeDefined();
    expect(screen.getByText("abc-7")).toBeDefined();
    expect(screen.getByText("Curry de garbanzos")).toBeDefined();
    expect(screen.getByRole("button", { name: "Confirmar asistencia de abc-7" })).toBeDefined();
    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/api/v1/asistencias?fecha=${hoyISO()}&page=0&size=50`);
    expect(new Headers(opciones.headers).get("Authorization")).toBe("Bearer token-admin");
  });

  it("informa cuando no hay reservas activas", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(pagina([]))));
    abrir();
    expect(await screen.findByText("No hay reservas activas para esta fecha.")).toBeDefined();
  });

  it("confirma la asistencia y muestra la hora de Argentina", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json(pagina([RESERVA])))
      .mockResolvedValueOnce(json({ id: 1, reservaId: 7, administradorId: 3, confirmadaEn: "2026-11-09T15:10:00Z" }));
    vi.stubGlobal("fetch", fetchMock);
    abrir();

    fireEvent.click(await screen.findByRole("button", { name: "Confirmar asistencia de abc-7" }));

    expect(await screen.findByText("Asistencia confirmada a las 12:10.")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Confirmar asistencia de abc-7" })).toBeNull();
    const [url, opciones] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toContain("/api/v1/reservas/7/confirmacion-asistencia");
    expect(opciones.method).toBe("POST");
  });

  it("muestra la advertencia del backend si la asistencia ya estaba confirmada", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(json(pagina([RESERVA])))
      .mockResolvedValueOnce(json({ message: "La asistencia ya fue confirmada" }, 409)));
    abrir();

    fireEvent.click(await screen.findByRole("button", { name: "Confirmar asistencia de abc-7" }));

    expect(await screen.findByText("La asistencia ya fue confirmada")).toBeDefined();
    expect(screen.getByRole("button", { name: "Confirmar asistencia de abc-7" })).toBeDefined();
  });

  it("muestra la hora cuando la reserva ya tenía asistencia", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(pagina([{ ...RESERVA, asistenciaConfirmadaEn: "2026-11-09T15:10:00Z" }]))));
    abrir();
    expect(await screen.findByText("Asistencia confirmada a las 12:10.")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Confirmar asistencia de abc-7" })).toBeNull();
  });
});

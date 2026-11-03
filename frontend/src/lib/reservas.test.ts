import { describe, expect, it } from "vitest";
import { limiteReserva, puedeGestionarReserva } from "./reservas";

describe("horario de gestión de reservas", () => {
  it("permite una activa hasta antes de las 09:00 de Argentina", () => {
    const reserva = { fecha: "2026-11-03", estado: "ACTIVA" } as const;
    expect(limiteReserva(reserva.fecha)).toBe(Date.parse("2026-11-03T12:00:00Z"));
    expect(puedeGestionarReserva(reserva, Date.parse("2026-11-03T11:59:59.999Z"))).toBe(true);
    expect(puedeGestionarReserva(reserva, Date.parse("2026-11-03T12:00:00Z"))).toBe(false);
  });

  it("admite fechas futuras pero no pasadas ni canceladas", () => {
    const ahora = Date.parse("2026-11-03T18:00:00Z");
    expect(puedeGestionarReserva({ fecha: "2026-11-04", estado: "ACTIVA" }, ahora)).toBe(true);
    expect(puedeGestionarReserva({ fecha: "2026-11-02", estado: "ACTIVA" }, ahora)).toBe(false);
    expect(puedeGestionarReserva({ fecha: "2026-11-04", estado: "CANCELADA" }, ahora)).toBe(false);
  });
});

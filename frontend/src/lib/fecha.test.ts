import { describe, expect, it, vi, afterEach } from "vitest";
import { diasDisponibles, fechaLegible, hoyISO, proximoLaborable, diaSemanaCorto, numeroDia } from "./fecha";

/** Fija Date.now y new Date() al instante dado (ISO). */
function fijarFecha(iso: string) {
  vi.useFakeTimers({ now: new Date(iso + "T12:00:00") });
}

afterEach(() => vi.useRealTimers());

describe("hoyISO", () => {
  it("devuelve la fecha local incluso después de las 21 hs (UTC-3)", () => {
    // 28 de octubre a las 22:00 en Argentina = 29 de octubre 01:00 UTC
    vi.useFakeTimers({ now: new Date("2026-10-28T22:00:00-03:00") });
    expect(hoyISO()).toBe("2026-10-28");
  });
});

describe("fechaLegible", () => {
  it("formatea una fecha ISO como texto legible en español", () => {
    const resultado = fechaLegible("2026-11-03");
    expect(resultado).toMatch(/martes.+3 de noviembre/i);
  });

  it("la primera letra es mayúscula", () => {
    const resultado = fechaLegible("2026-10-28");
    expect(resultado[0]).toBe(resultado[0].toUpperCase());
  });
});

describe("diasDisponibles", () => {
  it("devuelve solo días laborables (lun-vie)", () => {
    fijarFecha("2026-10-28"); // miércoles
    const dias = diasDisponibles();
    for (const d of dias) {
      const dow = new Date(d + "T12:00:00").getDay();
      expect(dow).toBeGreaterThanOrEqual(1);
      expect(dow).toBeLessThanOrEqual(5);
    }
  });

  it("no devuelve más de 7 días desde hoy", () => {
    fijarFecha("2026-10-28");
    const dias = diasDisponibles();
    const hoy = new Date("2026-10-28T12:00:00");
    for (const d of dias) {
      const diff = (new Date(d + "T12:00:00").getTime() - hoy.getTime()) / 86400000;
      expect(diff).toBeLessThanOrEqual(7);
      expect(diff).toBeGreaterThanOrEqual(0);
    }
  });

  it("incluye hoy si es laborable", () => {
    fijarFecha("2026-10-28"); // miércoles
    expect(diasDisponibles()).toContain("2026-10-28");
  });

  it("no incluye hoy si es fin de semana", () => {
    fijarFecha("2026-10-31"); // sábado
    expect(diasDisponibles()).not.toContain("2026-10-31");
  });
});

describe("proximoLaborable", () => {
  it("devuelve hoy si es laborable", () => {
    fijarFecha("2026-10-28"); // miércoles
    expect(proximoLaborable()).toBe("2026-10-28");
  });

  it("devuelve el lunes siguiente si hoy es sábado", () => {
    fijarFecha("2026-10-31"); // sábado
    expect(proximoLaborable()).toBe("2026-11-02");
  });
});

describe("diaSemanaCorto", () => {
  it("devuelve el nombre corto capitalizado", () => {
    const resultado = diaSemanaCorto("2026-10-28");
    expect(resultado[0]).toBe(resultado[0].toUpperCase());
    expect(resultado.length).toBeLessThanOrEqual(5);
  });
});

describe("numeroDia", () => {
  it("devuelve el número del día del mes", () => {
    expect(numeroDia("2026-10-28")).toBe("28");
    expect(numeroDia("2026-11-03")).toBe("3");
  });
});

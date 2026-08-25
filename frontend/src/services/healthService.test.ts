import { afterEach, describe, expect, it, vi } from "vitest";
import { obtenerEstadoApi } from "./healthService";

describe("obtenerEstadoApi", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("devuelve el estado cuando la API responde correctamente", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "UP",
      application: "ReservApp API",
    }), { status: 200, headers: { "Content-Type": "application/json" } })));

    await expect(obtenerEstadoApi()).resolves.toEqual({
      status: "UP",
      application: "ReservApp API",
    });
  });

  it("rechaza respuestas con un contrato inválido", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "UNKNOWN" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })));

    await expect(obtenerEstadoApi()).rejects.toThrow("respuesta inesperada");
  });
});

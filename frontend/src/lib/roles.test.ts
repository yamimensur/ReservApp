import { describe, expect, it } from "vitest";
import { destinoAlIngresar } from "./roles";

describe("destinoAlIngresar", () => {
  it("vuelve a la página pedida si el rol puede verla", () => {
    expect(destinoAlIngresar("EMPLEADO", "/mis-reservas")).toBe("/mis-reservas");
    expect(destinoAlIngresar("ADMINISTRADOR", "/sistema")).toBe("/sistema");
  });

  it("si la página pedida es de otro rol, va a la pantalla principal del suyo", () => {
    expect(destinoAlIngresar("ADMINISTRADOR", "/sin-pantallas")).toBe("/reservas-del-dia");
    expect(destinoAlIngresar("EMPLEADO", "/reservas-del-dia")).toBe("/menu");
  });

  it("si la página no existe, también va a su pantalla principal", () => {
    expect(destinoAlIngresar("RRHH", "/cualquier-cosa")).toBe("/sin-pantallas");
  });
});

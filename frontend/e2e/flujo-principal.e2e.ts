import { expect, test } from "@playwright/test";
import { ADMINISTRADOR, EMPLEADO, HOY, ingresar, simularApi } from "./apiSimulada";

// Flujo principal (docs/spec.md §5), recorrido desde la interfaz:
// el empleado reserva y ve su reserva; el administrador confirma la asistencia.

test("el empleado reserva su almuerzo, la ve en Mis reservas y la cancela", async ({ page }) => {
  await simularApi(page);

  await ingresar(page, EMPLEADO.correo);
  await expect(page.getByRole("heading", { name: "Menú del día" })).toBeVisible();

  // El menú marca lo incompatible con sus restricciones y no deja elegirlo.
  await expect(page.getByRole("button", { name: /Ravioles de verdura/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Pollo al horno/ })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: /Flan casero/ }).click();
  await page.getByRole("button", { name: "Reservar almuerzo" }).click();

  await expect(page.getByText("¡Reserva confirmada!")).toBeVisible();
  await expect(page.getByText("RSV-0001")).toBeVisible();

  await page.getByRole("link", { name: "Mis reservas" }).click();
  const reserva = page.getByRole("article").filter({ hasText: "RSV-0001" });
  await expect(reserva).toContainText("Pollo al horno");
  await expect(reserva).toContainText("Flan casero");
  await expect(reserva).toContainText("Activa");

  await reserva.getByRole("button", { name: "Cancelar reserva" }).click();
  await reserva.getByRole("button", { name: "Sí, cancelar reserva" }).click();
  await expect(reserva).toContainText("Cancelada");
});

test("el administrador ve las reservas del día y confirma la asistencia", async ({ page }) => {
  const api = await simularApi(page);
  api.crearReserva(EMPLEADO, HOY, [2, 4]);

  await ingresar(page, ADMINISTRADOR.correo);
  await expect(page.getByRole("heading", { name: "Reservas del día" })).toBeVisible();

  const reserva = page.getByRole("article").filter({ hasText: "RSV-0001" });
  await expect(reserva).toContainText(EMPLEADO.correo);

  await reserva.getByRole("button", { name: "Confirmar asistencia de RSV-0001" }).click();
  await expect(reserva.getByRole("status")).toHaveText("Asistencia confirmada a las 08:00.");
});

test("con una contraseña incorrecta muestra el error y no entra", async ({ page }) => {
  await simularApi(page);

  await ingresar(page, EMPLEADO.correo, "incorrecta");

  await expect(page.getByText("Correo o contraseña incorrectos")).toBeVisible();
  await expect(page).toHaveURL(/\/ingresar$/);
});

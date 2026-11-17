import { expect, test } from "@playwright/test";
import { ADMINISTRADOR, EMPLEADO, ingresar, simularApi } from "./apiSimulada";

// Autorización desde la interfaz: cada rol ve solo sus pantallas.
// La regla real la aplica el backend (@PreAuthorize); esto prueba que la UI no la contradice.

test("sin sesión, una pantalla privada lleva al login", async ({ page }) => {
  await simularApi(page);

  await page.goto("/mis-reservas");

  await expect(page).toHaveURL(/\/ingresar$/);
  await expect(page.getByRole("heading", { name: "Ingresar" })).toBeVisible();
});

test("el empleado no puede entrar a la pantalla del administrador", async ({ page }) => {
  await simularApi(page);
  await ingresar(page, EMPLEADO.correo);
  await expect(page.getByRole("heading", { name: "Menú del día" })).toBeVisible();

  await page.goto("/reservas-del-dia");

  await expect(page.getByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Reservas del día" })).toHaveCount(0);
});

test("el administrador no ve las pantallas del empleado", async ({ page }) => {
  await simularApi(page);
  await ingresar(page, ADMINISTRADOR.correo);
  await expect(page.getByRole("heading", { name: "Reservas del día" })).toBeVisible();

  await page.goto("/mis-reservas");

  await expect(page.getByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
});

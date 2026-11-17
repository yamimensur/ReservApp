import { defineConfig, devices } from "@playwright/test";

// Tests E2E: abren la app en un navegador real y recorren el flujo como una persona.
// La API se simula dentro del test (e2e/apiSimulada.ts), así no dependen del backend
// ni tocan los datos de producción.
const PUERTO = 4173;
const URL_APP = `http://localhost:${PUERTO}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: URL_APP,
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Arma la app y la sirve como en producción. La API apunta al mismo origen
  // para que el navegador no haga pedidos CORS y el test los pueda interceptar.
  webServer: {
    command: `npx vite build && npx vite preview --port ${PUERTO} --strictPort`,
    url: URL_APP,
    reuseExistingServer: !process.env.CI,
    env: { VITE_API_URL: URL_APP },
    timeout: 120_000,
  },
});

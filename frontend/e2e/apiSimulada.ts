import type { Page, Route } from "@playwright/test";

// API simulada para los tests E2E. Responde con los mismos contratos que el backend
// (docs/api.md) y guarda las reservas en memoria, así el flujo se recorre de punta a punta.

/** Instante fijo de los tests: miércoles 18/11/2026 a las 08:00 de Argentina, antes del corte de las 09:00. */
export const AHORA = new Date("2026-11-18T08:00:00-03:00");
export const HOY = "2026-11-18";
export const PASSWORD = "password";

interface UsuarioDemo {
  id: number;
  correo: string;
  rol: "EMPLEADO" | "ADMINISTRADOR";
  tipoUsuario: "EMPLEADO";
  restricciones: string[];
}

export const EMPLEADO: UsuarioDemo = {
  id: 1, correo: "empleado@reservapp.demo", rol: "EMPLEADO", tipoUsuario: "EMPLEADO", restricciones: ["Celíaco"],
};
export const ADMINISTRADOR: UsuarioDemo = {
  id: 2, correo: "admin@reservapp.demo", rol: "ADMINISTRADOR", tipoUsuario: "EMPLEADO", restricciones: [],
};
const USUARIOS = [EMPLEADO, ADMINISTRADOR];

const COMIDAS = [
  { id: 1, nombre: "Ensalada mixta", tipo: "ENTRADA", compatible: true },
  { id: 2, nombre: "Pollo al horno", tipo: "PLATO_PRINCIPAL", compatible: true },
  { id: 3, nombre: "Ravioles de verdura", tipo: "PLATO_PRINCIPAL", compatible: false },
  { id: 4, nombre: "Flan casero", tipo: "POSTRE", compatible: true },
  { id: 5, nombre: "Agua", tipo: "BEBIDA", compatible: true },
] as const;

interface Reserva {
  id: number;
  codigo: string;
  usuarioId: number;
  menuId: number;
  fecha: string;
  estado: "ACTIVA" | "CANCELADA";
  creadaEn: string;
  comidas: { id: number; nombre: string; tipo: string }[];
  notificacion: "ENVIADA" | "NO_ENVIADA" | null;
  asistenciaConfirmadaEn: string | null;
}

function pagina<T>(contenido: T[]) {
  return { content: contenido, number: 0, totalPages: 1, totalElements: contenido.length, first: true, last: true };
}

function error(route: Route, status: number, mensaje: string) {
  return route.fulfill({
    status,
    json: { timestamp: AHORA.toISOString(), status, error: "Error", message: mensaje, fields: null },
  });
}

/** Instala la API simulada en la página. Devuelve las reservas, por si el test quiere precargar alguna. */
export async function simularApi(page: Page) {
  const reservas: Reserva[] = [];
  let siguienteId = 1;

  function crearReserva(usuario: UsuarioDemo, fecha: string, comidaIds: number[]): Reserva {
    const id = siguienteId++;
    const reserva: Reserva = {
      id,
      codigo: `RSV-${String(id).padStart(4, "0")}`,
      usuarioId: usuario.id,
      menuId: 1,
      fecha,
      estado: "ACTIVA",
      creadaEn: AHORA.toISOString(),
      comidas: COMIDAS.filter((c) => comidaIds.includes(c.id)).map(({ id: cid, nombre, tipo }) => ({ id: cid, nombre, tipo })),
      notificacion: "ENVIADA",
      asistenciaConfirmadaEn: null,
    };
    reservas.push(reserva);
    return reserva;
  }

  // El navegador usa el reloj fijo: así "hoy" y el corte de las 09:00 no dependen del día en que corre el test.
  await page.clock.setFixedTime(AHORA);

  await page.route("**/api/v1/**", async (route) => {
    const pedido = route.request();
    const url = new URL(pedido.url());
    const ruta = url.pathname;
    const metodo = pedido.method();
    const token = pedido.headers()["authorization"]?.replace("Bearer ", "");
    const usuario = USUARIOS.find((u) => `token-${u.correo}` === token);

    if (ruta === "/api/v1/auth/login" && metodo === "POST") {
      const { correo, password } = pedido.postDataJSON() as { correo: string; password: string };
      const encontrado = USUARIOS.find((u) => u.correo === correo);
      if (!encontrado || password !== PASSWORD) return error(route, 401, "Correo o contraseña incorrectos");
      return route.fulfill({ json: { token: `token-${correo}`, tipo: "Bearer", expiraEn: "2026-11-18T12:00:00Z" } });
    }

    if (!usuario) return error(route, 401, "Necesitás iniciar sesión");

    if (ruta === "/api/v1/usuarios/me") return route.fulfill({ json: usuario });

    if (ruta === "/api/v1/menus" && metodo === "GET") {
      return route.fulfill({ json: { id: 1, fecha: url.searchParams.get("fecha"), comidas: COMIDAS } });
    }

    if (ruta === "/api/v1/reservas" && metodo === "POST") {
      if (usuario.rol !== "EMPLEADO") return error(route, 403, "No tenés permiso para esta acción");
      const { fecha, comidaIds } = pedido.postDataJSON() as { fecha: string; comidaIds: number[] };
      const yaReservo = reservas.some((r) => r.usuarioId === usuario.id && r.fecha === fecha && r.estado === "ACTIVA");
      if (yaReservo) return error(route, 409, "Ya tenés una reserva activa para esa fecha");
      const { asistenciaConfirmadaEn: _, ...creada } = crearReserva(usuario, fecha, comidaIds);
      return route.fulfill({ status: 201, json: creada });
    }

    if (ruta === "/api/v1/reservas" && metodo === "GET") {
      const propias = reservas.filter((r) => r.usuarioId === usuario.id).map(({ asistenciaConfirmadaEn: _, ...r }) => r);
      return route.fulfill({ json: pagina(propias) });
    }

    const cancelar = ruta.match(/^\/api\/v1\/reservas\/(\d+)$/);
    if (cancelar && metodo === "DELETE") {
      const reserva = reservas.find((r) => r.id === Number(cancelar[1]) && r.usuarioId === usuario.id);
      if (!reserva) return error(route, 404, "No existe la reserva");
      reserva.estado = "CANCELADA";
      return route.fulfill({ status: 204, body: "" });
    }

    if (ruta === "/api/v1/asistencias" && metodo === "GET") {
      if (usuario.rol !== "ADMINISTRADOR") return error(route, 403, "No tenés permiso para esta acción");
      const fecha = url.searchParams.get("fecha");
      const delDia = reservas
        .filter((r) => r.fecha === fecha && r.estado === "ACTIVA")
        .map((r) => ({
          id: r.id, codigo: r.codigo, correo: USUARIOS.find((u) => u.id === r.usuarioId)?.correo ?? "",
          fecha: r.fecha, estado: r.estado, comidas: r.comidas, asistenciaConfirmadaEn: r.asistenciaConfirmadaEn,
        }));
      return route.fulfill({ json: pagina(delDia) });
    }

    const confirmar = ruta.match(/^\/api\/v1\/reservas\/(\d+)\/confirmacion-asistencia$/);
    if (confirmar && metodo === "POST") {
      if (usuario.rol !== "ADMINISTRADOR") return error(route, 403, "No tenés permiso para esta acción");
      const reserva = reservas.find((r) => r.id === Number(confirmar[1]));
      if (!reserva) return error(route, 404, "No existe la reserva");
      if (reserva.asistenciaConfirmadaEn) return error(route, 409, "La asistencia ya fue confirmada");
      reserva.asistenciaConfirmadaEn = AHORA.toISOString();
      return route.fulfill({
        status: 201,
        json: { id: 1, reservaId: reserva.id, administradorId: usuario.id, confirmadaEn: reserva.asistenciaConfirmadaEn },
      });
    }

    return error(route, 404, `La API simulada no conoce ${metodo} ${ruta}`);
  });

  return { reservas, crearReserva };
}

/** Inicia sesión desde la pantalla de login, como lo haría una persona. */
export async function ingresar(page: Page, correo: string, password = PASSWORD) {
  await page.goto("/ingresar");
  await page.getByLabel("Correo electrónico").fill(correo);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

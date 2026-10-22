import type { Rol } from "@/types/auth";

/** Cómo se muestra cada rol en la interfaz. */
export const NOMBRE_ROL: Record<Rol, string> = {
  EMPLEADO: "Empleado",
  TERCERIZADO: "Personal tercerizado",
  ADMINISTRADOR: "Administrador del comedor",
  RRHH: "RR. HH.",
};

/** Pantalla principal de cada rol (CU0014 del TP: "redirige según el rol"). */
export function paginaDeInicio(rol: Rol): string {
  switch (rol) {
    case "EMPLEADO":
    case "TERCERIZADO":
      return "/menu";
    case "ADMINISTRADOR":
      return "/reservas-del-dia";
    case "RRHH":
      return "/sin-pantallas";
  }
}

/** Rutas propias de cada rol. Tiene que coincidir con los grupos de RutaProtegida en router.tsx. */
const RUTAS_DEL_ROL: Record<Rol, string[]> = {
  EMPLEADO: ["/menu", "/mis-reservas"],
  TERCERIZADO: ["/menu", "/mis-reservas"],
  ADMINISTRADOR: ["/reservas-del-dia"],
  RRHH: ["/sin-pantallas"],
};

/** Rutas que ve cualquier usuario con sesión. */
const RUTAS_COMUNES = ["/", "/sistema"];

/**
 * A dónde ir después de iniciar sesión.
 * Volvemos a la página que pidió antes del login solo si su rol puede verla;
 * si no, lo llevamos a su pantalla principal en vez de mostrarle un 404.
 */
export function destinoAlIngresar(rol: Rol, desde: string): string {
  const permitida = RUTAS_COMUNES.includes(desde) || RUTAS_DEL_ROL[rol].includes(desde);
  return permitida ? desde : paginaDeInicio(rol);
}

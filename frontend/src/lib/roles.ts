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

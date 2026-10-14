export type Rol = "EMPLEADO" | "TERCERIZADO" | "ADMINISTRADOR" | "RRHH";

export interface Credenciales {
  correo: string;
  password: string;
}

/** Respuesta de POST /api/v1/auth/login. */
export interface LoginResponse {
  token: string;
  tipo: string;
  expiraEn: string;
}

/** Respuesta de GET /api/v1/usuarios/me. */
export interface Usuario {
  id: number;
  correo: string;
  rol: Rol;
  tipoUsuario: "EMPLEADO" | "TERCERIZADO";
  restricciones: string[];
}
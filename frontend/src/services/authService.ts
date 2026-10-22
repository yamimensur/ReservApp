import type { Credenciales, LoginResponse, Usuario } from "@/types/auth";
import { pedirApi } from "./apiClient";
import { borrarToken, guardarToken } from "./tokenStorage";

/** Inicia sesión: pide el token, lo guarda y devuelve el perfil del usuario. */
export async function iniciarSesion(credenciales: Credenciales): Promise<Usuario> {
  // Un token viejo o vencido haría que el backend rechace el login con 401: lo sacamos antes.
  borrarToken();
  const { token } = await pedirApi<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(credenciales),
  });
  guardarToken(token);
  try {
    return await obtenerUsuarioActual();
  } catch (error) {
    borrarToken();
    throw error;
  }
}

/** Perfil del usuario dueño del token (rol y restricciones). */
export function obtenerUsuarioActual(signal?: AbortSignal): Promise<Usuario> {
  return pedirApi<Usuario>("/api/v1/usuarios/me", { signal });
}

export function cerrarSesion(): void {
  borrarToken();
}
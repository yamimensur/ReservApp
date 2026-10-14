// Dónde guardamos el JWT del usuario logueado.
// sessionStorage: sobrevive a un F5, pero se borra al cerrar la pestaña.
const CLAVE = "reservapp.token";

export function leerToken(): string | null {
  return sessionStorage.getItem(CLAVE);
}

export function guardarToken(token: string): void {
  sessionStorage.setItem(CLAVE, token);
}

export function borrarToken(): void {
  sessionStorage.removeItem(CLAVE);
}